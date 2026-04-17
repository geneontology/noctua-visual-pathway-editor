import { environment } from './../../environments/environment';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import * as ModelDefinition from './../data/config/model-definition';
import * as EntityDefinition from './../data/config/entity-definition';

import { noctuaFormConfig } from './../noctua-form-config';
import { NoctuaFormConfigService } from './config/noctua-form-config.service';
import { NoctuaLookupService } from './lookup.service';
import { NoctuaUserService } from './../services/user.service';
import { Activity, ActivityType, compareActivity } from './../models/activity/activity';
import { find, each, differenceWith } from 'lodash';
import { CurieService } from './../../@noctua.curie/services/curie.service';
import { ActivityNode } from './../models/activity/activity-node';
import { Cam, CamLoadingIndicator, CamOperation } from './../models/activity/cam';
import { Entity } from './../models/activity/entity';
import { Evidence } from './../models/activity/evidence';
import { Predicate } from './../models/activity/predicate';
import { Triple } from './../models/activity/triple';
import * as moment from 'moment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { graph as bbopGraph } from 'bbop-graph-noctua';
import { CardinalityViolation, RelationViolation } from '@noctua.form/models/activity/error/violation-error';
import { NoctuaLoadingOverlayService } from '@noctua/services/loading-overlay.service';

declare const require: any;

const amigo = require('amigo2');
const barista_response = require('bbop-response-barista');
const minerva_requests = require('minerva-requests');
const jquery_engine = require('bbop-rest-manager').jquery;
const class_expression = require('class-expression');
const minerva_manager = require('bbop-manager-minerva');

@Injectable({
  providedIn: 'root'
})
export class NoctuaGraphService {
  baristaLocation = environment.globalBaristaLocation;
  minervaDefinitionName = environment.globalMinervaDefinitionName;
  linker = new amigo.linker();
  curieUtil: any;

  onCamRebuildChange: BehaviorSubject<any>;
  onCamChanged: BehaviorSubject<Cam>;
  onCamGraphChanged: BehaviorSubject<Cam>;
  onActivityAdded: BehaviorSubject<Activity>;

  constructor(
    private curieService: CurieService,
    private httpClient: HttpClient,
    private noctuaUserService: NoctuaUserService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    private noctuaLookupService: NoctuaLookupService,
    private loadingOverlayService: NoctuaLoadingOverlayService) {

    this.curieUtil = this.curieService.getCurieUtil();
    this.onCamRebuildChange = new BehaviorSubject(null);
    this.onCamChanged = new BehaviorSubject(null);
    this.onCamGraphChanged = new BehaviorSubject(null);
    this.onActivityAdded = new BehaviorSubject(null);
  }

  registerManager(useReasoner = false) {
    const engine = new jquery_engine(barista_response);
    engine.method('POST');

    const manager = new minerva_manager(
      this.baristaLocation,
      this.minervaDefinitionName,
      this.noctuaUserService.baristaToken,
      engine, 'async');


    const managerError = (resp) => {
      console.log('There was a manager error (' +
        resp.message_type() + '): ' + resp.message());
    };

    const warning = (resp) => {
      alert('Warning: ' + resp.message() + '; ' +
        'your operation was likely not performed');
    };

    const error = (resp) => {
      const perm_flag = 'InsufficientPermissionsException';
      const token_flag = 'token';
      if (resp.message() && resp.message().indexOf(perm_flag) !== -1) {
        alert('Error: it seems like you do not have permission to ' +
          'perform that operation. Did you remember to login?');
      } else if (resp.message() && resp.message().indexOf(token_flag) !== -1) {
        alert('Error: it seems like you have a bad token...');
      } else {
        console.log('error:', resp, resp.message_type(), resp.message());

        if (resp.message().includes('UnknownIdentifierException')) {
          //  cam.error = true
        }
      }
    };

    const shieldsUp = () => { };
    const shieldsDown = () => { };

    manager.register('prerun', shieldsUp);
    manager.register('postrun', shieldsDown, 9);
    manager.register('manager_error', managerError, 10);
    manager.register('warning', warning, 10);
    manager.register('error', error, 10);

    manager.use_reasoner_p(useReasoner);

    return manager;
  }

  getGraphInfo(cam: Cam, modelId) {
    const self = this;

    cam.loading = new CamLoadingIndicator(true, 'Loading Model Activities ...');
    this.loadingOverlayService.show('Loading Model Activities...');
    cam.id = modelId;
    //cam.baristaClient = this.registerBaristaClient(cam);
    cam.manager = this.registerManager(true);
    cam.copyModelManager = this.registerManager();
    cam.groupManager = this.registerManager();
    cam.replaceManager = this.registerManager(false);
    cam.manager.register('rebuild', function (resp) {
      console.log('Rebuild response:', resp);
      self.rebuild(cam, resp);
    }, 10);
  }

  getMetadata(responseData) {
    const self = this;
    const cam = new Cam()

    cam.graph = new bbopGraph();
    cam.graph.load_data_basic(responseData);

    cam.id = responseData.id;
    cam.model = Object.assign({}, {
      modelInfo: this.noctuaFormConfigService.getModelUrls(cam.id)
    });
    cam.modified = responseData['modified-p'];

    const titleAnnotations = cam.graph.get_annotations_by_key('title');
    const commentAnnotations = cam.graph.get_annotations_by_key('comment');
    const stateAnnotations = cam.graph.get_annotations_by_key('state');
    const dateAnnotations = cam.graph.get_annotations_by_key('date');
    const groupAnnotations = cam.graph.get_annotations_by_key('providedBy');
    const contributorAnnotations = cam.graph.get_annotations_by_key('contributor');

    cam.contributors = self.noctuaUserService.getContributorsFromAnnotations(contributorAnnotations);
    cam.groups = self.noctuaUserService.getGroupsFromAnnotations(groupAnnotations);

    if (dateAnnotations.length > 0) {
      cam.date = dateAnnotations[0].value();
    }

    if (titleAnnotations.length > 0) {
      cam.title = titleAnnotations[0].value();
    }

    cam.comments = commentAnnotations.map(c => {
      return c.value();
    })

    if (groupAnnotations.length > 0) {
      cam.groupIds = groupAnnotations.map(g => {
        return g.value();
      })
    }

    if (stateAnnotations.length > 0) {
      cam.state = self.noctuaFormConfigService.findModelState(stateAnnotations[0].value());
    }

    return cam;

  }

  rebuild(cam: Cam, response) {
    const self = this;

    const packetId = response.packet_id();
    if (packetId && packetId !== 'unknown') {
      cam.processedPacketIds.add(packetId);
    }

    cam.graph = new bbopGraph();
    cam.graph.load_data_basic(response.data());


    cam.id = response.data().id;
    cam.modified = response.data()['modified-p'];
    cam.isReasoned = response['is-reasoned'];

    const titleAnnotations = cam.graph.get_annotations_by_key('title');
    const commentAnnotations = cam.graph.get_annotations_by_key('comment');
    const stateAnnotations = cam.graph.get_annotations_by_key('state');
    const dateAnnotations = cam.graph.get_annotations_by_key('date');
    const groupAnnotations = cam.graph.get_annotations_by_key('providedBy');
    const contributorAnnotations = cam.graph.get_annotations_by_key('contributor');

    cam.contributors = self.noctuaUserService.getContributorsFromAnnotations(contributorAnnotations);
    cam.groups = self.noctuaUserService.getGroupsFromAnnotations(groupAnnotations);

    if (dateAnnotations.length > 0) {
      cam.date = dateAnnotations[0].value();
    }

    if (titleAnnotations.length > 0) {
      cam.title = titleAnnotations[0].value();
    }

    cam.comments = commentAnnotations.map(c => {
      return c.value();
    })

    if (groupAnnotations.length > 0) {
      cam.groupIds = groupAnnotations.map(g => {
        return g.value();
      })
    }

    if (stateAnnotations.length > 0) {
      cam.state = self.noctuaFormConfigService.findModelState(stateAnnotations[0].value());
    }

    this.loadViolations(cam, response.data()['validation-results'])
    self.loadCam(cam);
    cam.loading.status = false;
    setTimeout(() => this.loadingOverlayService.hide(), 1000);
  }

  loadCam(cam: Cam) {
    const activities = this.graphToActivities(cam.graph);

    cam.validationErrors.shexViolations = cam.getViolationDisplayErrors();

    if (environment.isGraph) {
      const molecules = this.graphToMolecules(cam.graph);

      activities.push(...molecules);

      if (cam.operation === CamOperation.ADD_ACTIVITY) {
        const activity = this.getAddedActivity(activities, cam.activities);
        this.onActivityAdded.next(activity);
      }

      cam.activities = activities;
      cam.causalRelations = this.getCausalRelations(cam);
      this.getActivityLocations(cam)
    } else {
      cam.activities = activities;
    }

    cam.rawNodes = this.graphRawNodes(cam.graph);
    cam.rawTriples = this.graphRawEdges(cam.graph);

    cam.updateActivityDisplayNumber();
    cam.updateProperties()
    cam.operation = CamOperation.NONE;

    cam.setDiffs(cam.rawNodes, cam.rawTriples);

    this.onCamGraphChanged.next(cam);
    this.onCamChanged.next(cam);

  }

  getAddedActivity(a: Activity[], b: Activity[]): Activity {
    const activities = differenceWith(a, b, compareActivity);

    if (activities && activities.length > 0) {
      return activities[0];
    }

    return null;

  }

  loadViolations(cam: Cam, validationResults) {
    const self = this;
    let violations;

    if (validationResults &&
      validationResults['shex-validation'] &&
      validationResults['shex-validation']['violations']) {
      violations = validationResults['shex-validation']['violations'];
      // hasViolations is now derived from cam.validationErrors.hasErrors
      cam.violations = [];
      violations.forEach((violation: any) => {
        violation.explanations.forEach((explanation) => {
          explanation.constraints.forEach((constraint) => {
            const camViolation = self.generateViolation(cam, violation.node, constraint);

            if (camViolation) {
              cam.violations.push(camViolation);
            }
          });
        });
      });
    }

    cam.setViolations();
  }

  generateViolation(cam: Cam, node, constraint) {
    const self = this;
    const activityNode = self.nodeToActivityNode(cam.graph, node)

    if (!activityNode) {
      return null;
    }

    let violation;
    if (constraint.cardinality) {
      const edge = self.noctuaFormConfigService.findEdge(constraint.property);
      violation = new CardinalityViolation(
        activityNode,
        edge,
        constraint.nobjects,
        constraint.cardinality
      );
    } else if (constraint.object) {
      violation = new RelationViolation(activityNode);
      violation.predicate = self.noctuaFormConfigService.findEdge(constraint.property);

      const object = constraint.object.startsWith('http')
        ? self.curieUtil.getCurie(constraint.object)
        : constraint.object

      violation.object = self.nodeToActivityNode(cam.graph, object);
    }

    return violation;
  }

  getNodeInfo(node) {
    const result: any = {};

    each(node.types(), function (srcType) {
      const type = srcType.type() === 'complement' ? srcType.complement_class_expression() : srcType;

      result.id = type.class_id();
      result.label = type.class_label();
      result.classExpression = type;
    });

    return result;
  }

  getNodeRootInfo(node): Entity[] {
    const result = node.root_types().map((srcType) => {
      const type = srcType.type() === 'complement' ? srcType.complement_class_expression() : srcType;
      return new Entity(type.class_id(), type.class_label());
    });

    return result;
  }

  getNodeDate(node) {

    const date = node.get_annotations_by_key('date');

    if (date.length > 0) {
      return date[0].value();
    }

    return null;
  }

  getNodeLocation(node) {
    const result = {
      x: 0,
      y: 0
    };

    const x_annotations = node.get_annotations_by_key('hint-layout-x');
    const y_annotations = node.get_annotations_by_key('hint-layout-y');

    if (x_annotations.length === 1) {
      result.x = parseInt(x_annotations[0].value());
    }

    if (y_annotations.length === 1) {
      result.y = parseInt(y_annotations[0].value());
    }

    return result;
  }

  getNodeIsComplement(node) {
    let result = true;

    if (node) {
      each(node.types(), function (in_type) {
        const t = in_type.type();
        result = result && (t === 'complement');
      });
    }

    return result;
  }

  nodeToActivityNode(graph, objectId): Partial<ActivityNode> {
    const self = this;

    const node = graph.get_node(objectId);
    if (!node) {
      return null;
    }
    const nodeInfo = self.getNodeInfo(node);
    const nodeLabel = nodeInfo.label ? nodeInfo.label : nodeInfo.id
    const result = {
      uuid: objectId,
      date: self.getNodeDate(node),
      term: new Entity(nodeInfo.id, nodeLabel, self.linker.url(nodeInfo.id), objectId),
      rootTypes: self.getNodeRootInfo(node),
      classExpression: nodeInfo.classExpression,
      location: self.getNodeLocation(node),
      isComplement: self.getNodeIsComplement(node),
    };

    return new ActivityNode(result);
  }

  edgeToEvidence(graph, edge): Evidence[] {

    const self = this;
    const evidenceAnnotations = edge.get_annotations_by_key('evidence');
    const result = [];

    each(evidenceAnnotations, function (evidenceAnnotation) {
      const annotationId = evidenceAnnotation.value();
      const annotationNode = graph.get_node(annotationId);
      const evidence = new Evidence();

      evidence.edge = new Entity(edge.predicate_id(), '');
      evidence.uuid = annotationNode?.id();
      if (annotationNode) {

        const nodeInfo = self.getNodeInfo(annotationNode);
        evidence.setEvidence(new Entity(nodeInfo.id,
          nodeInfo.label,
          self.noctuaLookupService.getTermURL(nodeInfo.id)), nodeInfo.classExpression);

        const sources = annotationNode.get_annotations_by_key('source');
        const withs = annotationNode.get_annotations_by_key('with');
        const contributorAnnotations = annotationNode.get_annotations_by_key('contributor');
        const groupAnnotations = annotationNode.get_annotations_by_key('providedBy');

        const date = self.getNodeDate(annotationNode);
        const formattedDate = (moment as any)(date, 'YYYY-MM-DD')
        evidence.date = date
        evidence.formattedDate = formattedDate.format('ll');

        if (sources.length > 0) {
          const sorted = sources.sort(self._compareSources)
          evidence.reference = sorted.map((source) => {
            return source.value();
          }).join('| ')
          const referenceUrl = self.noctuaLookupService.getTermURL(evidence.reference);
          evidence.referenceEntity = new Entity(evidence.reference, evidence.reference, referenceUrl, evidence.uuid)
        }

        if (withs.length > 0) {
          evidence.with = withs[0].value();
          evidence.withEntity = new Entity(evidence.with, evidence.with, null, evidence.uuid)
        }

        if (groupAnnotations.length > 0) {
          evidence.groups = self.noctuaUserService.getGroupsFromAnnotations(groupAnnotations);
        }

        if (contributorAnnotations.length > 0) {
          evidence.contributors = self.noctuaUserService.getContributorsFromAnnotations(contributorAnnotations);
        }

        result.push(evidence);
      }
    });

    return result;
  }

  isStartEdge(subjectNode, predicateId) {
    return predicateId === noctuaFormConfig.edge.enabledBy.id ||
      ((predicateId === noctuaFormConfig.edge.partOf.id ||
        predicateId === noctuaFormConfig.edge.locatedIn.id ||
        predicateId === noctuaFormConfig.edge.isActiveIn.id) &&

        subjectNode.hasRootType(EntityDefinition.GoMolecularEntity))
  }

  getActivityPreset(subjectNode: Partial<ActivityNode>, objectNode: Partial<ActivityNode>, predicateId, bbopSubjectEdges): Activity {
    const self = this;
    let activityType = ActivityType.default;

    if ((predicateId === noctuaFormConfig.edge.partOf.id ||
      predicateId === noctuaFormConfig.edge.locatedIn.id ||
      predicateId === noctuaFormConfig.edge.isActiveIn.id) &&
      subjectNode.hasRootType(EntityDefinition.GoMolecularEntity)) {

      activityType = ActivityType.ccOnly;
    } else if (subjectNode.term.id === noctuaFormConfig.rootNode.mf.id) {
      each(bbopSubjectEdges, function (subjectEdge) {
        if (find(noctuaFormConfig.causalEdges, { id: subjectEdge.predicate_id() })) {
          activityType = ActivityType.bpOnly;
        }
      });
    } else if (objectNode.hasRootType(EntityDefinition.GoProteinContainingComplex)) {
      activityType = ActivityType.proteinComplex;
    }

    return self.noctuaFormConfigService.createActivityBaseModel(activityType);
  }

  graphToActivities(camGraph): Activity[] {
    const self = this;
    const activities: Activity[] = [];

    each(camGraph.all_edges(), (bbopEdge) => {
      const bbopSubjectId = bbopEdge.subject_id();
      const bbopObjectId = bbopEdge.object_id();
      const subjectNode = self.nodeToActivityNode(camGraph, bbopSubjectId);
      const objectNode = self.nodeToActivityNode(camGraph, bbopObjectId);

      if (self.isStartEdge(subjectNode, bbopEdge.predicate_id())) {

        const subjectEdges = camGraph.get_edges_by_subject(bbopSubjectId);
        const activity: Activity = self.getActivityPreset(subjectNode, objectNode, bbopEdge.predicate_id(), subjectEdges);
        const subjectActivityNode = activity.rootNode;

        subjectActivityNode.term = subjectNode.term;
        subjectActivityNode.date = subjectNode.date;
        subjectActivityNode.classExpression = subjectNode.classExpression;
        subjectActivityNode.setIsComplement(subjectNode.isComplement);
        subjectActivityNode.uuid = bbopSubjectId;
        self._graphToActivityDFS(camGraph, activity, subjectEdges, subjectActivityNode);
        activity.id = bbopSubjectId;
        activity.uuid = bbopSubjectId;

        activity.postRunUpdateCompliment();

        activity.postRunUpdate();

        if (!environment.isGraph || activity.activityType !== ActivityType.ccOnly) {
          activities.push(activity);
        }

      }
    });

    return activities;
  }

  graphToMolecules(camGraph): Activity[] {
    const self = this;
    const activities: Activity[] = [];

    each(camGraph.all_nodes(), (bbopNode) => {
      const subjectNode = self.nodeToActivityNode(camGraph, bbopNode.id());

      if (subjectNode.hasRootType(EntityDefinition.GoChemicalEntity) && !subjectNode.hasRootType(EntityDefinition.GoMolecularEntity)) {
        const subjectEdges = camGraph.get_edges_by_subject(bbopNode.id())
        const objectEdges = camGraph.get_edges_by_object(bbopNode.id())

        const hasEnabledBy = find(objectEdges, (edge) => {
          return edge.predicate_id() === noctuaFormConfig.edge.enabledBy.id
        })

        if (!hasEnabledBy) {
          const activity: Activity = self.noctuaFormConfigService.createActivityBaseModel(ActivityType.molecule);
          const subjectActivityNode = activity.rootNode;

          subjectActivityNode.term = subjectNode.term;
          subjectActivityNode.date = subjectNode.date;
          subjectActivityNode.classExpression = subjectNode.classExpression;
          subjectActivityNode.uuid = bbopNode.id();
          activity.id = bbopNode.id();
          activity.uuid = bbopNode.id();
          self._graphToActivityDFS(camGraph, activity, subjectEdges, subjectActivityNode);
          //activity.postRunUpdate();
          activities.push(activity);
        }
      }

    });

    return activities
  }

  getCausalRelations(cam: Cam) {
    const self = this;
    const triples: Triple<Activity>[] = [];
    each(cam.activities, (subjectActivity: Activity) => {
      each(cam.graph.get_edges_by_subject(subjectActivity.id), (bbopEdge) => {
        const predicateId = bbopEdge.predicate_id();
        const evidence = self.edgeToEvidence(cam.graph, bbopEdge);
        const objectId = bbopEdge.object_id();
        const objectInfo = self.nodeToActivityNode(cam.graph, objectId);
        const edges = noctuaFormConfig.allEdges
        const causalEdge = this.noctuaFormConfigService.findEdge(predicateId)

        if (objectInfo.hasRootType(EntityDefinition.GoMolecularFunction)
          || objectInfo.hasRootType(EntityDefinition.GoChemicalEntity)) {
          const objectActivity = cam.findActivityById(objectId);
          const predicate = new Predicate(causalEdge, evidence)

          if (causalEdge.id === noctuaFormConfig.edge.hasInput.id) {
            predicate.isReverseLink = true;
            predicate.reverseLinkTitle = 'input of'
          }
          const triple = new Triple<Activity>(subjectActivity, objectActivity, predicate);

          if (triple.subject && triple.object) {
            triples.push(triple);
          }
        }
      });
    });

    return triples;
  }




  graphRawEdges(camGraph): Triple<ActivityNode>[] {
    const self = this;
    const triples: Triple<ActivityNode>[] = [];

    each(camGraph.all_edges(), (bbopEdge) => {
      const bbopSubjectId = bbopEdge.subject_id();
      const bbopObjectId = bbopEdge.object_id();
      const subjectNode = self.nodeToActivityNode(camGraph, bbopSubjectId) as ActivityNode;
      const objectNode = self.nodeToActivityNode(camGraph, bbopObjectId) as ActivityNode;

      const bbopPredicateId = bbopEdge.predicate_id();
      const evidence = self.edgeToEvidence(camGraph, bbopEdge);
      const triple = new Triple<ActivityNode>(subjectNode, objectNode, new Predicate(this.noctuaFormConfigService.findEdge(bbopPredicateId), evidence));

      triple.predicate.isComplement = triple.object.isComplement;
      triple.predicate.evidence = evidence;

      triples.push(triple);

    });

    return triples;
  }

  graphRawNodes(camGraph): ActivityNode[] {
    const nodes: ActivityNode[] = [];

    camGraph.all_nodes()?.forEach((bbopNode) => {

      const node = this.nodeToActivityNode(camGraph, bbopNode.id()) as ActivityNode;

      if (node && !node.hasRootType(EntityDefinition.GoEvidenceNode)) {
        nodes.push(node);
      }
    });

    return nodes;
  }

  saveModelGroup(cam: Cam, groupId) {
    cam.manager.use_groups([groupId]);
    cam.groupId = groupId;
  }

  copyModel(cam: Cam, title, includeEvidence = false) {
    const self = this;
    const baristaUrl = environment.globalBaristaLocation
    const globalMinervaDefinitionName = environment.globalMinervaDefinitionName

    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

    const requests = [
      {
        "entity": "model",
        "operation": "copy",
        "arguments":
        {
          "model-id": cam.id,
          "preserve-evidence": includeEvidence,
          "values": [
            {
              "key": "title",
              "value": title
            }]
        }
      }]
    let payload = `token=${this.noctuaUserService.baristaToken}&intention=query&requests=${encodeURIComponent(JSON.stringify(requests))}`

    if (self.noctuaUserService.user && self.noctuaUserService.user.groups.length > 0) {
      payload = payload + '&provided-by=' + self.noctuaUserService.user.group.id;
    }
    return this.httpClient.post(`${baristaUrl}/api/${globalMinervaDefinitionName}/m3BatchPrivileged`, payload, { headers });
  }

  saveCamAnnotations(cam: Cam, annotations) {
    const self = this;
    this.loadingOverlayService.show('Saving...');

    const titleAnnotations = cam.graph.get_annotations_by_key('title');
    const stateAnnotations = cam.graph.get_annotations_by_key('state');
    const commentAnnotations = cam.graph.get_annotations_by_key('comment');
    const reqs = new minerva_requests.request_set(self.noctuaUserService.baristaToken, cam.id);

    each(titleAnnotations, function (annotation) {
      reqs.remove_annotation_from_model('title', annotation.value());
    });

    each(stateAnnotations, function (annotation) {
      reqs.remove_annotation_from_model('state', annotation.value());
    });

    each(commentAnnotations, function (annotation) {
      reqs.remove_annotation_from_model('comment', annotation.value());
    });

    reqs.add_annotation_to_model('title', annotations.title);
    reqs.add_annotation_to_model('state', annotations.state);

    annotations.comments.forEach(comment => {
      reqs.add_annotation_to_model('comment', comment);
    });

    reqs.store_model(cam.id);
    cam.manager.request_with(reqs);
  }

  addActivity(cam: Cam, nodes: ActivityNode[], triples: Triple<ActivityNode>[], title, operation = CamOperation.ADD_ACTIVITY) {
    const self = this;
    this.loadingOverlayService.show('Saving Activity...');
    const reqs = new minerva_requests.request_set(self.noctuaUserService.baristaToken, cam.model.id);

    if (!cam.title) {
      reqs.add_annotation_to_model('title', title);
    }

    each(nodes, function (node: ActivityNode) {
      self.addIndividual(reqs, node);
    });

    self.addFact(reqs, triples);

    if (self.noctuaUserService.user && self.noctuaUserService.user.groups.length > 0) {
      reqs.use_groups([self.noctuaUserService.user.group.id]);
    }

    cam.operation = operation;

    reqs.store_model(cam.id);

    return cam.manager.request_with(reqs);
  }

  editConnection(cam: Cam,
    removeTriples: Triple<ActivityNode>[],
    addTriples: Triple<ActivityNode>[]) {

    const self = this;
    this.loadingOverlayService.show('Saving...');
    const reqs = new minerva_requests.request_set(self.noctuaUserService.baristaToken, cam.id);

    each(removeTriples, (triple: Triple<ActivityNode>) => {
      reqs.remove_fact([
        triple.subject.uuid,
        triple.object.uuid,
        triple.predicate.edge.id
      ]);
    });

    self.addFact(reqs, addTriples);

    if (self.noctuaUserService.user && self.noctuaUserService.user.groups.length > 0) {
      reqs.use_groups([self.noctuaUserService.user.group.id]);
    }

    reqs.store_model(cam.id);
    return cam.manager.request_with(reqs);
  }

  editActivity(cam: Cam,
    addNodes: ActivityNode[],
    addTriples: Triple<ActivityNode>[],
    removeIds: string[],
    removeTriples: Triple<ActivityNode>[] = []) {

    const self = this;
    this.loadingOverlayService.show('Saving...');
    const reqs = new minerva_requests.request_set(self.noctuaUserService.baristaToken, cam.id);

    each(addNodes, function (destNode: ActivityNode) {
      self.addIndividual(reqs, destNode);
    });

    //self.editFact(reqs, srcTriples, addTriples);


    each(removeTriples, function (triple: Triple<ActivityNode>) {
      reqs.remove_fact([
        triple.subject.uuid,
        triple.object.uuid,
        triple.predicate.edge.id
      ]);
    });
    self.addFact(reqs, addTriples);

    each(removeIds, function (uuid: string) {
      reqs.remove_individual(uuid);
    });

    if (self.noctuaUserService.user && self.noctuaUserService.user.groups.length > 0) {
      reqs.use_groups([self.noctuaUserService.user.group.id]);
    }

    reqs.store_model(cam.id);

    return cam.manager.request_with(reqs);
  }

  bulkEditActivity(cam: Cam): Observable<any> {
    const self = this;
    this.loadingOverlayService.show('Saving...');
    const reqs = new minerva_requests.request_set(self.noctuaUserService.baristaToken, cam.id);

    each(cam.activities, (activity: Activity) => {
      each(activity.nodes, (node: ActivityNode) => {
        self.bulkEditIndividual(reqs, cam.id, node);
        each(node.predicate.evidence, (evidence: Evidence) => {
          self.bulkEditEvidence(reqs, cam.id, evidence);
        });
      });
    });

    if (self.noctuaUserService.user && self.noctuaUserService.user.groups.length > 0) {
      reqs.use_groups([self.noctuaUserService.user.group.id]);
    }

    return cam.replaceManager.request_with(reqs);
  }

  bulkEditActivityNode(cam: Cam, node: ActivityNode) {
    const self = this;
    this.loadingOverlayService.show('Saving...');
    const reqs = new minerva_requests.request_set(self.noctuaUserService.baristaToken, cam.id);

    self.bulkEditIndividual(reqs, cam.id, node);
    each(node.predicate.evidence, (evidence: Evidence) => {
      self.bulkEditEvidence(reqs, cam.id, evidence);
    });

    if (self.noctuaUserService.user && self.noctuaUserService.user.groups.length > 0) {
      reqs.use_groups([self.noctuaUserService.user.group.id]);
    }

    reqs.store_model(cam.id);

    return cam.replaceManager.request_with(reqs);
  }

  deleteActivity(cam: Cam, uuids: string[], triples: Triple<ActivityNode>[]) {
    const self = this;
    this.loadingOverlayService.show('Deleting...');

    const success = () => {
      const reqs = new minerva_requests.request_set(self.noctuaUserService.baristaToken, cam.model.id);

      each(triples, function (triple: Triple<ActivityNode>) {
        reqs.remove_fact([
          triple.subject.uuid,
          triple.object.uuid,
          triple.predicate.edge.id
        ]);
      });

      each(uuids, function (uuid: string) {
        reqs.remove_individual(uuid);
      });

      reqs.store_model(cam.id);

      if (self.noctuaUserService.user && self.noctuaUserService.user.groups.length > 0) {
        reqs.use_groups([self.noctuaUserService.user.group.id]);
      }

      return cam.manager.request_with(reqs);
    };

    return success();
  }

  deleteEvidence(cam: Cam, uuid: string) {
    const self = this;
    this.loadingOverlayService.show('Deleting...');

    const success = () => {
      const reqs = new minerva_requests.request_set(self.noctuaUserService.baristaToken, cam.model.id);


      reqs.remove_evidence(uuid, cam.model.id);

      reqs.store_model(cam.id);

      if (self.noctuaUserService.user && self.noctuaUserService.user.groups.length > 0) {
        reqs.use_groups([self.noctuaUserService.user.group.id]);
      }

      return cam.manager.request_with(reqs);
    };

    return success();
  }

  deleteEvidenceAnnotation(cam: Cam, uuid: string, key: 'source' | 'with', oldValue: string) {
    const self = this;
    this.loadingOverlayService.show('Deleting...');

    const success = () => {
      const reqs = new minerva_requests.request_set(self.noctuaUserService.baristaToken, cam.model.id);

      reqs.remove_annotation_from_individual(key, oldValue, null, uuid);
      reqs.store_model(cam.id);

      if (self.noctuaUserService.user && self.noctuaUserService.user.groups.length > 0) {
        reqs.use_groups([self.noctuaUserService.user.group.id]);
      }

      return cam.manager.request_with(reqs);
    };

    return success();
  }

  addFact(reqs, triples: Triple<ActivityNode>[]) {
    const self = this;

    each(triples, function (triple: Triple<ActivityNode>) {
      const subject = self.addIndividual(reqs, triple.subject);
      const object = self.addIndividual(reqs, triple.object);

      if (subject && object) {
        triple.predicate.uuid = reqs.add_fact([
          subject,
          object,
          triple.predicate.edge.id
        ]);

        each(triple.predicate.evidence, function (evidence: Evidence) {
          const evidenceReference = evidence.reference;
          const evidenceWith = evidence.with;

          reqs.add_evidence(evidence.evidence.id, evidenceReference, evidenceWith, triple.predicate.uuid);
        });
      }
    });
  }

  deleteFact(reqs, triples: Triple<ActivityNode>[]) {
    each(triples, function (triple: Triple<ActivityNode>) {
      each(triple.predicate.evidence, function (evidence: Evidence) {
        reqs.remove_individual(evidence.uuid);
      });
      reqs.remove_individual(triple.subject.uuid);
    });
  }

  addIndividual(reqs: any, node: ActivityNode): string | null {
    if (node.uuid) {
      return node.uuid;
    }

    if (node.hasValue()) {
      if (node.isComplement) {
        const ce = new class_expression();
        ce.as_complement(node.term.id);
        node.uuid = reqs.add_individual(ce);
      } else {
        node.uuid = reqs.add_individual(node.term.id);
      }
      return node.uuid;
    }

    return null;
  }

  editIndividual(reqs, cam: Cam, srcNode, destNode) {
    if (srcNode.hasValue() && destNode.hasValue()) {
      reqs.remove_type_from_individual(
        srcNode.classExpression,
        srcNode.uuid,
        cam.id,
      );

      reqs.add_type_to_individual(
        class_expression.cls(destNode.getTerm().id),
        srcNode.uuid,
        cam.id,
      );
    }
  }

  bulkEditIndividual(reqs, camId: string, node: ActivityNode) {
    if (node.hasValue() && node.pendingEntityChanges) {
      reqs.remove_type_from_individual(
        class_expression.cls(node.pendingEntityChanges.oldValue.id),
        node.pendingEntityChanges.uuid,
        camId,
      );

      reqs.add_type_to_individual(
        class_expression.cls(node.pendingEntityChanges.newValue.id),
        node.pendingEntityChanges.uuid,
        camId,
      );
    }
  }


  bulkEditEvidence(reqs, camId: string, evidence: Evidence) {
    if (evidence.hasValue() && evidence.pendingEvidenceChanges) {
      reqs.remove_type_from_individual(
        class_expression.cls(evidence.pendingEvidenceChanges.oldValue.id),
        evidence.uuid,
        camId,
      );

      reqs.add_type_to_individual(
        class_expression.cls(evidence.pendingEvidenceChanges.newValue.id),
        evidence.pendingEvidenceChanges.uuid,
        camId,
      );

      this.editUserEvidenceAnnotations(reqs, evidence.pendingEvidenceChanges.uuid)
    }

    if (evidence.hasValue() && evidence.pendingReferenceChanges) {
      reqs.remove_annotation_from_individual('source', evidence.pendingReferenceChanges.oldValue.id, null, evidence.pendingReferenceChanges.uuid);
      reqs.add_annotation_to_individual('source',
        evidence.pendingReferenceChanges.newValue.id,
        null,
        evidence.pendingReferenceChanges.uuid)
      this.editUserEvidenceAnnotations(reqs, evidence.pendingReferenceChanges.uuid)
    }

    if (evidence.hasValue() && evidence.pendingWithChanges) {
      reqs.remove_annotation_from_individual('with', evidence.pendingWithChanges.oldValue.id, null, evidence.pendingWithChanges.uuid);
      reqs.add_annotation_to_individual('with',
        evidence.pendingWithChanges.newValue.id,
        null,
        evidence.pendingWithChanges.uuid)
      this.editUserEvidenceAnnotations(reqs, evidence.pendingWithChanges.uuid)
    }
  }

  editUserEvidenceAnnotations(reqs, uuid) {
    reqs.remove_annotation_from_individual('provided-by', this.noctuaUserService.user.group.url, null, uuid);
    reqs.add_annotation_to_individual('provided-by', this.noctuaUserService.user.group.url, null, uuid);
    reqs.remove_annotation_from_individual('contributor', this.noctuaUserService.user.orcid, null, uuid);
    reqs.add_annotation_to_individual('contributor', this.noctuaUserService.user.orcid, null, uuid);
  }

  replaceIndividual(reqs, modelId: string, entity: Entity, replaceWithTerm: Entity) {
    reqs.remove_type_from_individual(
      class_expression.cls(entity.id),
      entity.uuid,
      modelId,
    );

    reqs.add_type_to_individual(
      class_expression.cls(replaceWithTerm.id),
      entity.uuid,
      modelId,
    );
  }

  deleteIndividual(reqs, node) {
    if (node.uuid) {
      reqs.remove_individual(node.uuid);
    }
  }

  getActivityLocations(cam: Cam) {
    const locations = localStorage.getItem(`activityLocations-${cam.id}`);

    if (locations) {
      cam.manualLayout = true;
      const activityLocations = JSON.parse(locations)
      cam.activities.forEach((activity: Activity) => {
        const activityLocation = find(activityLocations, { id: activity.id })
        if (activityLocation) {
          activity.position.x = activityLocation.x;
          activity.position.y = activityLocation.y
        }
      })
    }
  }

  setActivityLocations(cam: Cam) {
    const locations = cam.activities.map((activity: Activity) => {
      return {
        id: activity.id,
        x: activity.position.x,
        y: activity.position.y
      }
    })
    localStorage.setItem(`activityLocations-${cam.id}`, JSON.stringify(locations));
  }

  addActivityLocation(cam: Cam, activity: Activity) {
    const locations = [...cam.activities, ...[activity]].map((activity: Activity) => {
      return {
        id: activity.id,
        x: activity.position.x,
        y: activity.position.y
      }
    })
    localStorage.setItem(`activityLocations-${cam.id}`, JSON.stringify(locations));
  }

  private _graphToActivityDFS(camGraph, activity: Activity, bbopEdges, subjectNode: ActivityNode) {
    const self = this;

    each(bbopEdges, (bbopEdge) => {
      const bbopPredicateId = bbopEdge.predicate_id();
      const bbopObjectId = bbopEdge.object_id();
      const evidence = self.edgeToEvidence(camGraph, bbopEdge);
      const partialObjectNode = self.nodeToActivityNode(camGraph, bbopObjectId);
      const objectNode = this._insertNode(activity, bbopPredicateId, subjectNode, partialObjectNode);

      activity.updateEntityInsertMenu();

      if (objectNode) {
        const triple: Triple<ActivityNode> = activity.getEdge(subjectNode.id, objectNode.id);
        if (triple) {
          triple.object.uuid = partialObjectNode.uuid;
          triple.object.term = partialObjectNode.term;
          triple.object.date = partialObjectNode.date;
          triple.object.classExpression = partialObjectNode.classExpression;
          triple.object.setIsComplement(partialObjectNode.isComplement);
          triple.predicate.isComplement = triple.object.isComplement;
          triple.predicate.evidence = evidence;
          triple.predicate.uuid = bbopEdge.id();
          self._graphToActivityDFS(camGraph, activity, camGraph.get_edges_by_subject(bbopObjectId), triple.object);
        }
      }
    });

    return activity;
  }

  private _insertNode(activity: Activity, bbopPredicateId: string, subjectNode: ActivityNode,
    partialObjectNode: Partial<ActivityNode>): ActivityNode {
    const nodeDescriptions: ModelDefinition.InsertNodeDescription[] = subjectNode.canInsertNodes;
    let objectNode;

    each(nodeDescriptions, (nodeDescription: ModelDefinition.InsertNodeDescription) => {
      if (bbopPredicateId === nodeDescription.predicate.id) {
        if (partialObjectNode.hasRootTypes(nodeDescription.node.category)) {
          objectNode = ModelDefinition.insertNode(activity, subjectNode, nodeDescription);
          return false;
        }
      }
    });

    return objectNode;
  }

  private _compareSources(a: any, b: any) {
    return (a.value() > b.value()) ? -1 : 1;
  }

}
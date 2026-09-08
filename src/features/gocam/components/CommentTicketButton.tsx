import type React from 'react'
import { ActionIcon, Tooltip } from '@mantine/core'
import { FaGithub } from 'react-icons/fa'
import type { CommentTicket } from '../data/annotationDispute'

/**
 * Opens the pre-filled GitHub issue for a comment in a new tab, so a curator
 * can escalate a dispute or a pending ontology term to the tracker that triages
 * it (#231, #289). Rendered both on the comment thread in the panel and on the
 * comment row in the edit form; which tracker and wording it gets comes from
 * `commentTicket`.
 */
const CommentTicketButton: React.FC<{ ticket: CommentTicket }> = ({ ticket }) => (
  <Tooltip label={ticket.label} position="left" withArrow openDelay={300}>
    <ActionIcon
      component="a"
      href={ticket.href}
      target="_blank"
      rel="noopener noreferrer"
      variant="subtle"
      color={ticket.color}
      size="sm"
      onClick={e => e.stopPropagation()}
      aria-label={ticket.ariaLabel}
    >
      <FaGithub size={12} />
    </ActionIcon>
  </Tooltip>
)

export default CommentTicketButton

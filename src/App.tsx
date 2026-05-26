import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './app/layout/Layout'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { mantineTheme } from './@noctua.core/theme/mantineTheme'
import PathwayEditor from './app/PathwayViewer'
import SplashScreen from './features/users/components/SplashScreen'
import { AuthProvider } from './features/auth/authProvider'
import RightDrawerContent from './app/layout/RightDrawer'
import GlobalDialog from './@noctua.core/components/dialog/GlobalDialog'
import { DialogComponent } from './@noctua.core/components/dialog/dialogSlice'
import GlobalToast from './@noctua.core/components/toast/GlobalToast'
import AnnotationForm from './features/gocam/components/forms/AnnotationForm'
import CamTitleForm from './features/gocam/components/CamTitleForm'
import CamStateForm from './features/gocam/components/CamStateForm'
import CamCommentsForm from './features/gocam/components/CamCommentsForm'
import CopyModelDialog from './features/gocam/components/CopyModelDialog'
import ChemicalConnectorForm from './features/relations/components/ChemicalConnectorForm'

const DIALOG_COMPONENTS: Partial<Record<DialogComponent, React.ComponentType<any>>> = {
  [DialogComponent.ANNOTATION_FORM]: AnnotationForm,
  [DialogComponent.CAM_TITLE_FORM]: CamTitleForm,
  [DialogComponent.CAM_STATE_FORM]: CamStateForm,
  [DialogComponent.CAM_COMMENTS_FORM]: CamCommentsForm,
  [DialogComponent.COPY_MODEL_DIALOG]: CopyModelDialog,
  [DialogComponent.CHEMICAL_CONNECTOR_FORM]: ChemicalConnectorForm,
}

const routes = [
  {
    path: '/',
    element: <Layout rightDrawerContent={<RightDrawerContent />} />,
    children: [{ path: '', element: <PathwayEditor /> }],
  },
]

const router = createBrowserRouter(routes, {
  basename: import.meta.env.VITE_BASE_URL,
})

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <MantineProvider theme={mantineTheme}>
        <Notifications />
        <AuthProvider>
          <SplashScreen>
            <RouterProvider router={router} />
            <GlobalDialog componentMap={DIALOG_COMPONENTS} />
            <GlobalToast />
          </SplashScreen>
        </AuthProvider>
      </MantineProvider>
    </React.StrictMode>
  )
}

export default App

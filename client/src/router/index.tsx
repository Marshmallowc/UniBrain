import { createBrowserRouter, Navigate } from "react-router-dom";
import BasicLayout from "../layout/BasicLayout";
import ChatPage from "../pages/ChatPage";
import LibraryPage from "../pages/LibraryPage";
import PDFReaderPage from "../pages/PDFReaderPage";
import MePage from "../pages/MePage";

const router = createBrowserRouter([
  {
    path: '/',
    element: <BasicLayout />,
    children: [
      {
        index: true,
        element: <Navigate to={'/chat'} replace />
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: 'library',
        element: <LibraryPage />,
      },
      {
        path: 'me',
        element: <MePage />,
      },
    ]
  },
  {
    path: '/reader',
    element: <PDFReaderPage />
  },
  {
    path: '*',
    element: <div>404 NOT FOUND</div>
  }
])

export default router
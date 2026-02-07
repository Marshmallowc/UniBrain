import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import BasicLayout from './layout/BasicLayout'
import ChatPage from './pages/ChatPage'
import LibraryPage from './pages/LibraryPage'
import PDFReaderPage from './pages/PDFReaderPage'
import MePage from './pages/MePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<BasicLayout />}>
          <Route index element={<Navigate to='/chat' replace />}></Route>
          <Route path='chat' element={<ChatPage />}></Route>
          <Route path='library' element={<LibraryPage />}></Route>
          <Route path='reader' element={<PDFReaderPage />}></Route>
          <Route path='me' element={<MePage />}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
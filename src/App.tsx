import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MapEditor from './pages/MapEditor';
import Management from './pages/Management';
import SharedView from './pages/SharedView';
import Login from './pages/Login';
import RequireAuth from './components/RequireAuth';
import MonthlyManagement from './pages/MonthlyManagement';
import MonthlyShare from './pages/MonthlyShare';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout>
                <MapEditor />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/management"
          element={
            <RequireAuth>
              <Layout>
                <Management />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/monthly"
          element={
            <RequireAuth>
              <Layout>
                <MonthlyManagement />
              </Layout>
            </RequireAuth>
          }
        />
        <Route path="/share" element={<SharedView />} />
        <Route path="/share-monthly" element={<MonthlyShare />} />
      </Routes>
    </BrowserRouter>
  );
}



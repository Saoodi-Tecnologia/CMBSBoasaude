/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MapEditor from './pages/MapEditor';
import Management from './pages/Management';
import SharedView from './pages/SharedView';
import Login from './pages/Login';
import RequireAuth from './components/RequireAuth';

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
        <Route path="/share" element={<SharedView />} />
      </Routes>
    </BrowserRouter>
  );
}


import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";

import AuthProvider from "./Auth/AuthProvider.tsx";
import ProtectedRoute from "./Auth/ProtectedRoute.tsx";

import Header from "./Areas/Header/Header.tsx";
import Nav from "./Areas/Nav/Nav.tsx";
import Home from "./Areas/Home/Home.tsx";
import App from "./Areas/Main/App.tsx";
import Profile from "./Areas/Profile/Profile.tsx";

import "./main.scss";

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <header>
          <Header></Header>
        </header>
        <nav>
          <Nav></Nav>
        </nav>
        <main>
          <Routes>
            <Route index element={<Home />} />
            <Route path="Spinner" element={<App />}></Route>
            <Route path="Profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>}
            ></Route>
          </Routes>
        </main>
        <footer>Footer</footer>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

// Components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Attendance from "./pages/Attendance";

// Admin
import AdminDashboard from "./pages/admin/Dashboard";
import Meetings from "./pages/admin/Meetings";
import Members from "./pages/admin/Members";
import Reports from "./pages/admin/Reports";
import MeetingDetail from "./pages/MeetingDetail";

// PR
import PRPanel from "./pages/PRPanel";

// Member
import MemberDashboard from "./pages/member/MemberDashboard";

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const routes = { admin: "/admin", pr: "/pr", member: "/member" };
  return <Navigate to={routes[user.role] || "/login"} replace />;
};

const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "12px",
            background: "#1e293b",
            color: "#fff",
            fontSize: "14px",
          },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/attendance/:token" element={<Attendance />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/meetings"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Layout>
                <Meetings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/meetings/:id"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Layout>
                <MeetingDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/members"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Layout>
                <Members />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* PR Routes */}
        <Route
          path="/pr"
          element={
            <ProtectedRoute roles={["pr"]}>
              <Layout>
                <PRPanel />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pr/meetings/:id"
          element={
            <ProtectedRoute roles={["pr"]}>
              <Layout>
                <MeetingDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Member Routes */}
        <Route
          path="/member"
          element={
            <ProtectedRoute roles={["member"]}>
              <Layout>
                <MemberDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;

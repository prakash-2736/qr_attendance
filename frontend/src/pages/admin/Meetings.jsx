import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Plus,
  Search,
  QrCode,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Calendar,
  Clock,
  Users,
  Download,
  Wifi,
  WifiOff,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";

const Meetings = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [qrModal, setQrModal] = useState(null); // { qrImage, title, code }
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "offline",
    startTime: "",
    endTime: "",
    enableGeofence: false,
    allowedRadius: "500",
  });

  const fetchData = async () => {
    try {
      const [meetingsRes, statsRes] = await Promise.all([
        api.get("/meetings"),
        api.get("/attendance/stats"),
      ]);
      setMeetings(meetingsRes.data);
      setStats(statsRes.data);
    } catch {
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCount = (meetingId) => {
    const s = stats.find((x) => x._id === meetingId);
    return s ? s.count : 0;
  };

  const getMeetingStatus = (meeting) => {
    const now = new Date();
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);

    if (!meeting.isActive)
      return { text: "Inactive", style: "bg-slate-100 text-slate-600" };
    if (now < start)
      return { text: "Upcoming", style: "bg-blue-100 text-blue-700" };
    if (now > end) return { text: "Ended", style: "bg-red-100 text-red-700" };
    return {
      text: "Live",
      style: "bg-emerald-100 text-emerald-700 animate-pulse",
    };
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.startTime || !form.endTime) {
      toast.error("Please fill all fields");
      return;
    }

    const payload = {
      title: form.title,
      type: form.type,
      startTime: form.startTime,
      endTime: form.endTime,
    };

    if (form.enableGeofence) {
      payload.allowedRadius = parseInt(form.allowedRadius) || 500;
    }

    setCreating(true);
    try {
      const res = await api.post("/meetings", payload);
      toast.success("Meeting created!");
      setQrModal({
        qrImage: res.data.qrImage,
        title: res.data.meeting.title,
        code: res.data.meeting.qrToken,
      });
      setShowCreate(false);
      setForm({
        title: "",
        type: "offline",
        startTime: "",
        endTime: "",
        enableGeofence: false,
        allowedRadius: "500",
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/meetings/${id}/toggle`);
      toast.success(res.data.message);
      fetchData();
    } catch {
      toast.error("Toggle failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this meeting and all its attendance records?")) return;
    try {
      await api.delete(`/meetings/${id}`);
      toast.success("Meeting deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  const showQR = async (meeting) => {
    try {
      const res = await api.get(`/meetings/${meeting._id}`);
      setQrModal({
        qrImage: res.data.qrImage,
        title: meeting.title,
        code: meeting.qrToken,
      });
    } catch {
      toast.error("Failed to generate QR");
    }
  };

  const downloadQR = () => {
    if (!qrModal?.qrImage) return;
    const a = document.createElement("a");
    a.href = qrModal.qrImage;
    a.download = `qr-${qrModal.title}.png`;
    a.click();
  };

  const filtered = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Meetings
          </h1>
          <p className="text-slate-500 mt-1">Create and manage meetings</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-5 h-5" />
          New Meeting
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meetings..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Meetings Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-100">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No meetings found</p>
          <p className="text-slate-400 text-sm mt-1">
            Create a new meeting to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
          {filtered.map((meeting) => {
            const status = getMeetingStatus(meeting);
            return (
              <div
                key={meeting._id}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden card-hover cursor-pointer group"
                onClick={() => navigate(`/admin/meetings/${meeting._id}`)}
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.style}`}
                        >
                          {status.text}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          {meeting.type === "online" ? (
                            <Wifi className="w-3.5 h-3.5" />
                          ) : (
                            <WifiOff className="w-3.5 h-3.5" />
                          )}
                          {meeting.type}
                        </span>
                        {meeting.latitude != null && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                            <MapPin className="w-3 h-3" />
                            GPS
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-3 py-1.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700">
                        {getCount(meeting._id)}
                      </span>
                    </div>
                  </div>

                  {/* Time info */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>
                        {new Date(meeting.startTime).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 ml-6">
                      {new Date(meeting.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" — "}
                      {new Date(meeting.endTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50/50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showQR(meeting);
                    }}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    <QrCode className="w-4 h-4" />
                    QR Code
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(meeting._id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        meeting.isActive
                          ? "text-emerald-600 hover:bg-emerald-50"
                          : "text-slate-400 hover:bg-slate-100"
                      }`}
                      title={meeting.isActive ? "Deactivate" : "Activate"}
                    >
                      {meeting.isActive ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(meeting._id);
                      }}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Meeting Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                Create Meeting
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Weekly Standup"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["offline", "online"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`p-3 rounded-xl border text-center transition-all font-medium capitalize ${
                        form.type === t
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {t === "online" ? (
                        <Wifi className="w-5 h-5 mx-auto mb-1" />
                      ) : (
                        <WifiOff className="w-5 h-5 mx-auto mb-1" />
                      )}
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700"
                  />
                </div>
              </div>

              {/* Geofencing Section */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enableGeofence}
                    onChange={(e) =>
                      setForm({ ...form, enableGeofence: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-slate-700">
                      Enable Geofencing
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 ml-auto">
                    Restrict by location
                  </span>
                </label>

                {form.enableGeofence && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-slate-400">
                      PR will set the venue location on-site. Enter the allowed
                      radius below.
                    </p>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Allowed Radius (meters)
                      </label>
                      <input
                        type="number"
                        min="10"
                        value={form.allowedRadius}
                        onChange={(e) =>
                          setForm({ ...form, allowedRadius: e.target.value })
                        }
                        placeholder="e.g. 500"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Create Meeting"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                {qrModal.title}
              </h3>
              <button
                onClick={() => setQrModal(null)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-2">
              <img
                src={qrModal.qrImage}
                alt="QR Code"
                className="w-64 h-64 mx-auto"
              />
            </div>

            <div className="bg-indigo-50 rounded-lg px-4 py-2 mb-4">
              <p className="text-xs text-indigo-400 font-medium">
                Attendance Code
              </p>
              <p className="text-3xl font-bold text-indigo-700 tracking-widest font-mono">
                {qrModal.code}
              </p>
            </div>

            <button
              onClick={downloadQR}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;

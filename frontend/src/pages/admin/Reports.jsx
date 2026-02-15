import { useEffect, useState } from "react";
import api from "../../services/api";
import {
  FileBarChart,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  MapPin,
  Clock,
  Users,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

const Reports = () => {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await api.get("/meetings");
        setMeetings(res.data);
      } catch {
        toast.error("Failed to load meetings");
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  useEffect(() => {
    if (!selectedMeeting) {
      setRecords([]);
      return;
    }

    const fetchRecords = async () => {
      setLoadingRecords(true);
      try {
        const res = await api.get(`/attendance/meeting/${selectedMeeting}`);
        setRecords(res.data);
      } catch {
        toast.error("Failed to load attendance");
      } finally {
        setLoadingRecords(false);
      }
    };
    fetchRecords();
  }, [selectedMeeting]);

  const exportCSV = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/attendance/export/${selectedMeeting}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${selectedMeeting}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("CSV downloaded!");
    } catch {
      toast.error("Export failed");
    }
  };

  const exportExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/attendance/export-excel/${selectedMeeting}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${selectedMeeting}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Excel downloaded!");
    } catch {
      toast.error("Export failed");
    }
  };

  const filtered = records.filter(
    (r) =>
      r.memberId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.memberId?.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedMeetingData = meetings.find((m) => m._id === selectedMeeting);

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
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Reports
        </h1>
        <p className="text-slate-500 mt-1">
          View and export attendance records
        </p>
      </div>

      {/* Meeting Selector + Export */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Select Meeting
            </label>
            <div className="relative">
              <select
                value={selectedMeeting}
                onChange={(e) => setSelectedMeeting(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">Choose a meeting...</option>
                {meetings.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title} — {new Date(m.startTime).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {selectedMeeting && records.length > 0 && (
            <div className="flex gap-2 sm:mt-6">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20"
              >
                <FileText className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={exportExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
            </div>
          )}
        </div>

        {/* Meeting info */}
        {selectedMeetingData && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(selectedMeetingData.startTime).toLocaleString()} —{" "}
              {new Date(selectedMeetingData.endTime).toLocaleTimeString()}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {records.length} attendees
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                selectedMeetingData.type === "online"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {selectedMeetingData.type}
            </span>
          </div>
        )}
      </div>

      {/* No meeting selected */}
      {!selectedMeeting && (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-100">
          <FileBarChart className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">
            Select a meeting to view its report
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Choose from the dropdown above
          </p>
        </div>
      )}

      {/* Loading */}
      {loadingRecords && (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Records Table */}
      {selectedMeeting && !loadingRecords && (
        <>
          {records.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-100">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">
                No attendance records
              </p>
            </div>
          ) : (
            <>
              {/* Search within records */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search attendees..."
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((record, i) => (
                        <tr
                          key={record._id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-5 py-4 text-sm text-slate-400">
                            {i + 1}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-xs">
                                {record.memberId?.name
                                  ?.charAt(0)
                                  .toUpperCase() || "?"}
                              </div>
                              <span className="font-medium text-slate-700">
                                {record.memberId?.name || "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">
                            {record.memberId?.email || "N/A"}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {record.location || "N/A"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-400">
                            {new Date(record.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;

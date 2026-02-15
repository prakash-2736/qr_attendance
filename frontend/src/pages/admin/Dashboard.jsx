import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  CalendarDays,
  Users,
  ClipboardCheck,
  Zap,
  ArrowRight,
  Clock,
} from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [memberStats, setMemberStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [meetingRes, memberRes] = await Promise.all([
          api.get("/meetings/admin/stats"),
          api.get("/members/admin/stats"),
        ]);
        setStats(meetingRes.data);
        setMemberStats(memberRes.data);
      } catch (error) {
        console.error("Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Meetings",
      value: stats?.totalMeetings || 0,
      icon: CalendarDays,
      color: "bg-indigo-500",
      shadow: "shadow-indigo-500/20",
    },
    {
      label: "Active Meetings",
      value: stats?.activeMeetings || 0,
      icon: Zap,
      color: "bg-emerald-500",
      shadow: "shadow-emerald-500/20",
    },
    {
      label: "Total Members",
      value: memberStats?.totalMembers || 0,
      icon: Users,
      color: "bg-blue-500",
      shadow: "shadow-blue-500/20",
    },
    {
      label: "Total Attendance",
      value: stats?.totalAttendance || 0,
      icon: ClipboardCheck,
      color: "bg-purple-500",
      shadow: "shadow-purple-500/20",
    },
  ];

  const getMeetingStatus = (meeting) => {
    const now = new Date();
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);

    if (!meeting.isActive)
      return { text: "Inactive", style: "bg-slate-100 text-slate-600" };
    if (now < start)
      return { text: "Upcoming", style: "bg-blue-100 text-blue-700" };
    if (now > end) return { text: "Ended", style: "bg-red-100 text-red-700" };
    return { text: "Live", style: "bg-emerald-100 text-emerald-700" };
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-500 mt-1">
          Overview of your attendance system
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 card-hover group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-slate-800 mt-1 animate-count">
                  {card.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center shadow-lg ${card.shadow} group-hover:scale-110 transition-transform duration-300`}
              >
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        {/* Recent Meetings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Recent Meetings</h2>
            <button
              onClick={() => navigate("/admin/meetings")}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 group"
            >
              View All{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {stats?.recentMeetings?.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No meetings created yet</p>
              </div>
            )}
            {stats?.recentMeetings?.map((meeting) => {
              const status = getMeetingStatus(meeting);
              return (
                <div
                  key={meeting._id}
                  className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/meetings/${meeting._id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-700">
                        {meeting.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-400">
                          {new Date(meeting.startTime).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.style}`}
                    >
                      {status.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/admin/meetings")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 group-hover:scale-110 transition-all duration-300">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-700">Create Meeting</p>
                <p className="text-xs text-slate-400">
                  Set up a new meeting with QR code
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate("/admin/members")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-300">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-700">Manage Members</p>
                <p className="text-xs text-slate-400">
                  Add or update team members
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate("/admin/reports")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 group-hover:scale-110 transition-all duration-300">
                <ClipboardCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-700">View Reports</p>
                <p className="text-xs text-slate-400">
                  Attendance records & exports
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { format, addMinutes, isBefore, parse } from 'date-fns';

const parseTime = (timeStr) => parse(timeStr, 'HHmmss', new Date());
const formatTime = (date) => format(date, 'HHmmss');

const IrrigationScheduler = () => {
  const [formData, setFormData] = useState({
    plots: 4,
    motors: 2,
    startTime: '060000',
    endTime: '190000',
    motorRuntime: 5,
    interval: 20,
  });

  const [schedule, setSchedule] = useState([]);
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [plotFilter, setPlotFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(format(new Date(), 'HHmmss'));

  useEffect(() => {
  const timer = setInterval(() => {
    const now = format(new Date(), 'HHmmss');
    setCurrentTime(now);
    updateScheduleStatus(now);
  }, 60000); 

  return () => clearInterval(timer); 
}, []);

  const itemsPerPage = 8;

  const updateScheduleStatus = (nowTime) => {
  setSchedule((prevSchedule) => {
    const updated = prevSchedule.map((item) => ({
      ...item,
      status: getStatus(item.startTime, item.endTime, nowTime),
    }));
    setFilteredSchedule((prevFiltered) =>
      prevFiltered.map((item) => ({
        ...item,
        status: getStatus(item.startTime, item.endTime, nowTime),
      }))
    );
    return updated;
  });
};


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 const getStatus = (start, end, now = currentTime) => {
  if (now < start) return 'Pending';
  if (now >= start && now <= end) return 'In Progress';
  return 'Done';
};


  const generateSchedule = () => {
    const plots = Array.from({ length: +formData.plots }, (_, i) => `D${i + 1}`);
    const motors = Array.from({ length: +formData.motors }, (_, i) => `M${i + 1}`);
    const { motorRuntime, interval } = formData;
    const start = parseTime(formData.startTime);
    const end = parseTime(formData.endTime);

    let currentTime = new Date(start);
    let index = 0;
    const schedule = [];

    while (isBefore(addMinutes(currentTime, +motorRuntime), end)) {
      for (let i = 0; i < plots.length; i += motors.length) {
        const motorCycleTime = new Date(currentTime);
        for (let j = 0; j < motors.length; j++) {
          const plotIndex = i + j;
          if (plotIndex >= plots.length) break;
          const plot = plots[plotIndex];
          const motor = motors[j];

          const startTime = new Date(motorCycleTime);
          const endTime = addMinutes(startTime, +motorRuntime);

          if (!isBefore(endTime, end)) break;

          schedule.push({
            index: index++,
            plot,
            startTime: formatTime(startTime),
            endTime: formatTime(endTime),
            RunBy: motor,
            status: getStatus(formatTime(startTime), formatTime(endTime)),
          });
        }
        currentTime = addMinutes(currentTime, +motorRuntime);
      }
      currentTime = addMinutes(currentTime, +interval);
    }

    setSchedule(schedule);
    setFilteredSchedule(schedule);
    setCurrentPage(1);
  };

  const handleFilter = () => {
    const filtered = schedule.filter((item) => {
      const matchPlot = plotFilter ? item.plot === plotFilter : true;
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchPlot && matchStatus;
    });
    setFilteredSchedule(filtered);
    setCurrentPage(1);
  };

  const paginatedData = filteredSchedule.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredSchedule.length / itemsPerPage);

  const exportToCSV = () => {

    if (filteredSchedule.length === 0) {
      alert('No data to export. Please generate a schedule first.');
      return;
    }
    const csvHeader = 'Index,Plot,Start,End,RunBy,Status\n';
    const csvRows = schedule.map(({ index, plot, startTime, endTime, RunBy, status }) =>
      `${index},${plot},${startTime},${endTime},${RunBy},${status}`
    );
    const blob = new Blob([csvHeader + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'irrigation_schedule.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-8 bg-gradient-to-b from-sky-400 to-white min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-white text-center">
        Irrigation System Dashboard
      </h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-6 bg-white p-6 rounded-xl shadow-lg">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 capitalize">{key}</label>
            <input
              type="text"
              name={key}
              value={value}
              onChange={handleChange}
              className="mt-1 p-2 text-black border rounded-md w-full"
            />
          </div>
        ))}
        <button
          onClick={generateSchedule}
          className="col-span-2 mt-4 p-3 bg-blue-600 hover:cursor-pointer hover:bg-blue-400 text-white rounded-lg"
        >
          Generate Schedule
        </button>
        <button
          onClick={exportToCSV}
          className="col-span-2 mt-2 p-3 bg-green-600 hover:bg-green-400 hover:cursor-pointer text-white rounded-lg"
        >
          Export to CSV
        </button>
      </div>

      <div className="bg-white text-black p-4 rounded-xl mb-4 flex flex-col sm:flex-row gap-4 shadow-md">
        <select
          value={plotFilter}
          onChange={(e) => setPlotFilter(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="">Filter by Plot</option>
          {Array.from(new Set(schedule.map((s) => s.plot))).map((plot) => (
            <option key={plot} value={plot}>{plot}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="">Filter by Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
        <button
          onClick={handleFilter}
          className="bg-blue-500 text-white flex  px-4 py-1 rounded-md"
        >
                    Apply Filters

        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 4.6C3 4.03995 3 3.75992 3.10899 3.54601C3.20487 3.35785 3.35785 3.20487 3.54601 3.10899C3.75992 3 4.03995 3 4.6 3H19.4C19.9601 3 20.2401 3 20.454 3.10899C20.6422 3.20487 20.7951 3.35785 20.891 3.54601C21 3.75992 21 4.03995 21 4.6V6.33726C21 6.58185 21 6.70414 20.9724 6.81923C20.9479 6.92127 20.9075 7.01881 20.8526 7.10828C20.7908 7.2092 20.7043 7.29568 20.5314 7.46863L14.4686 13.5314C14.2957 13.7043 14.2092 13.7908 14.1474 13.8917C14.0925 13.9812 14.0521 14.0787 14.0276 14.1808C14 14.2959 14 14.4182 14 14.6627V17L10 21V14.6627C10 14.4182 10 14.2959 9.97237 14.1808C9.94787 14.0787 9.90747 13.9812 9.85264 13.8917C9.7908 13.7908 9.70432 13.7043 9.53137 13.5314L3.46863 7.46863C3.29568 7.29568 3.2092 7.2092 3.14736 7.10828C3.09253 7.01881 3.05213 6.92127 3.02763 6.81923C3 6.70414 3 6.58185 3 6.33726V4.6Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>

        </button>
      </div>

      <div className="bg-white text-black rounded-xl shadow-xl p-4 overflow-x-auto">
        <table className="min-w-full table-auto text-left">
          <thead>
            <tr className="text-gray-700 border-b">
              <th>#</th>
              <th>Plot</th>
              <th>Start</th>
              <th>End</th>
              <th>Run By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(({ index, plot, startTime, endTime, RunBy, status }) => (
              <tr key={index} className="border-b my-2 hover:bg-gray-100">
                <td>{index+1}</td>
                <td>{plot}</td>
                <td>{startTime}</td>
                <td>{endTime}</td>
                <td>{RunBy}</td>
                <td>
                  <span
                    className={`px-2 py-1 my-2 text-xs font-semibold rounded-full ${
                      status === 'Pending'
                        ? 'bg-blue-100 text-blue-800'
                        : status === 'In Progress'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IrrigationScheduler;

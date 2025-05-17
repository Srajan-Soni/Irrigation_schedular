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
  const itemsPerPage = 8;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getStatus = (start, end) => {
    const now = format(new Date(), 'HHmmss');
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

 

  return (
    <div className="p-4 sm:p-8 w-full bg-gradient-to-b from-sky-400 to-white min-h-screen">
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
          className="col-span-2 mt-4 p-3 bg-blue-600 text-white rounded-lg"
        >
          Generate Schedule
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
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Apply Filters
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
          
          </tbody>
        </table>

       
      </div>
    </div>
  );
};

export default IrrigationScheduler;

// components/HourlyGraph.js
import React from 'react';

function HourlyGraph({ entries }) {
  const hourCounts = Array(24).fill(0);
  
  entries.forEach(entry => {
    const hour = new Date(entry).getHours();
    hourCounts[hour]++;
  });

  return (
    <div className="hourly-graph">
      {hourCounts.map((count, hour) => (
        <div
          key={hour}
          className="hour-bar"
          style={{
            height: `${count * 10}px`,
            backgroundColor: `rgba(0, 128, 0, ${count * 0.2 + 0.1})`,
          }}
          title={`${hour}:00 - ${count} entries`}
        />
      ))}
    </div>
  );
}

export default HourlyGraph;
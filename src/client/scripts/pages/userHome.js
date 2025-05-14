// userHome.js
import { getUsernameFromToken } from "../../scripts/utils/authCheck.js";
import { apiRequest }           from "../../scripts/api.js";


// async function drawValueChart(range = '1d') {
//     const resp = await apiRequest(`/api/uservalue?range=${range}`, 'GET');
//   if (!resp.success) return;
//   const data = resp.data.data;
//   const labels = data.map(r => new Date(r.timestamp));
//   const values = data.map(r => +r.total_value);

//   const ctx = document.getElementById('valueChart').getContext('2d');
//   if (window._valueChart) window._valueChart.destroy();
//   window._valueChart = new Chart(ctx, {
//     type: 'line',
//     data: {
//       labels,
//       datasets: [{
//         label: 'Portfolio Value',
//         data: values,
//         fill: false,
//         borderColor: '#026807',
//         tension: 0.1,
//       }]
//     },
//     options: {
//       scales: {
//         x: { type: 'time', time: { unit: 'hour' } },
//         y: { beginAtZero: false }
//       },
//       plugins: { legend: { display: true } }
//     }
//   });
// }


async function drawValueChart(range = '1d') {
    const resp = await apiRequest(`/api/uservalue?range=${range}`, 'GET');
    if (!resp.success) return;
    const raw = resp.data.data;  // array of { timestamp, total_value }
  
    let labels, values;
    if (range === '1d') {
      // 1) Prepare a map of existing points (ms since epoch → value)
      const dataMap = new Map();
      raw.forEach(r => {
        const d = new Date(r.timestamp);
        d.setSeconds(0,0);
        dataMap.set(d.getTime(), parseFloat(r.total_value));
      });
  
      // 2) Determine today’s open & close in local time
      const now = new Date();
      const open  = new Date(now);
      open.setHours(9,30,0,0);
      const close = new Date(now);
      close.setHours(16,0,0,0);
  
      // 3) Build full series
      labels = [];
      values = [];
      let lastValue = 0;
      for (let t = open.getTime(); t <= close.getTime(); t += 60_000) {
        labels.push(new Date(t));
        if (t > now.getTime()) {
          values.push(null);
        } else if (dataMap.has(t)) {
          lastValue = dataMap.get(t);
          values.push(lastValue);
        } else {
          values.push(lastValue);
        }
      }
    } else {
      // fallback for other ranges (no interpolation)
      labels = raw.map(r => new Date(r.timestamp));
      values = raw.map(r => parseFloat(r.total_value));
    }
  
    // 4) Draw chart
    const ctx = document.getElementById('valueChart').getContext('2d');
    if (window._valueChart) window._valueChart.destroy();
    window._valueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Portfolio Value',
          data: values,
          fill: false,
          borderColor: '#026807',
          spanGaps: true,       // connect across nulls if you prefer
          tension: 0.1,
        }]
      },
      options: {
        scales: {
          x: { type: 'time', time: { unit: 'minute' } },
          y: { beginAtZero: true }
        },
        plugins: { legend: { display: false } }
      }
    });
}


document.addEventListener('DOMContentLoaded', () => {
  drawValueChart('1d');
});

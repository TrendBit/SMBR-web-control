const DATA_COUNT = 12;

const data = {
    labels: [],
    datasets: [
      {
        data: [],
        borderColor: "red",
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.4
      }
    ]
  };
const ctx = document.getElementById('myChart');
const myChart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      animations: false,
      interaction: {
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          title: {
            display: false
          },
          suggestedMin: 0,
          suggestedMax: 10,
        },
        y: {
          display: true,
          title: {
            display: false,
          },
          suggestedMin: 0,
          suggestedMax: 100
        }
      }
    },
  });

console.log(myChart);

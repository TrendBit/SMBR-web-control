const DATA_COUNT = 12;

function getCountdownArray(length){
  result = [];
  for (let i = 0; i < length; i++) {
      result.push(i);
  }
  return result;
}

const data = {
    labels: getCountdownArray(16),
    datasets: [
      {
        data: [],
        borderColor: "red",
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.4,
        borderColor: '#ff8c00',
        backgroundColor: '#9BD0F5'
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

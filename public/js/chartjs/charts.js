var reportsChartOptions = {
    elements: {
        point: {
            pointRadius: 2,
            pointHoverRadius: 3
        }
    },
    plugins: {
        legend: { display: false, },
        tooltip: {
            xAlign: 'center', 
            yAlign: 'bottom',
            displayColors: false,
            mode: 'y',
            borderWidth: 1,
            borderColor: "var(--default)",
            caretPadding: 10,
            backgroundColor: 'white', //put to transparent
            titleFont: { size: 0 },
            bodyFont: { size: 18 },
            bodyColor: "black",
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if(chartTypeSales) {
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                            }).format(context.parsed.y);
                        }
                    }
                    else label = context.parsed.y;
                    return label;
               }
            }
        }
    },
    maintainAspectRatio: false,
    responsive: true,
    scales: {
        x: {
            ticks: {
                maxTicksLimit: 12,
                padding: 12
            }
        },
        y: {
            ticks: {
                maxTicksLimit: 6,
                padding: 8
            }
        }
    }
};

function UpdateChartOptions() {
    var percent = '';

    if(chartPercentage) {
        percent = '%';
        render = 'percentage';
    }
    dashboardChart.options = {
        plugins: {
            legend: { display: false },
            tooltip: {
                //enabled: false
                displayColors: false,
                formatter: (value) => {
                    return value + percent;
                }
            },
            datalabels: {
                formatter: (value) => {
                    return value + percent;
                },
                color: 'white'
            },
            labels: {
                render: 'label',
                fontSize: 10,
                fontColor: 'var(--default)',
                fontStyle: 'bold',
                position: 'outside',
                textMargin: 2,
                textShadow: true,
                shadowBlur: 10,
                arc: true,
                overlap: false
            }
        },
        layout: { 
            padding: 30
        },
        responsive: true
    };
}
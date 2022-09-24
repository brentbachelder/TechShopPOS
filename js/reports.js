var myChart;
var chartTypeSales = true;
var chartBasisWeekly = false;

function InitReports() {
    document.getElementById("page-title").innerHTML = "REPORTS & INVOICES";
    document.getElementById("mobile-page-title").innerHTML = "REPORTS & INVOICES";
    DrawReports();
    CreateChart();
    UpdateReportChart();
}

function CreateChart() {
    myChart = new Chart("sales-chart", {
        type: "line",
        options: reportsChartOptions
    });
}

function UpdateReportChart() {
    UpdateChartHeader();
    
    var xValues = GetChartX();
    var yValues = {};
    if(chartBasisWeekly) yValues = GetWeeklySales();
    else yValues = GetMonthlySales();
    console.log(yValues);

    myChart.data.labels = xValues;
    myChart.data.datasets = [
        { data: yValues[0], borderColor: "red", fill: false }, 
        { data: yValues[1], borderColor: "green", fill: false }, 
        { data: yValues[2], borderColor: "blue", fill: false }
    ];
    myChart.update();
}

function GetChartX() {
    if(chartBasisWeekly) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    else {
        var tempDays = [];
        for(var i = 1; i < 32; i++) tempDays.push(i.toString());
        return tempDays;
    }
}

function GetWeeklySales() {
    var currentDay = new Date().getDay();
    var numOfDays = currentDay + 15;
    var final = {};
    var thisWeek = [];
    var lastWeek = [];
    var twoWeeks = [];

    for(var i = 0; i < numOfDays; i++) {
        var date = new Date();
        date.setDate(date.getDate() - (numOfDays - i) + 1);
        var YR = date.getFullYear();
        var MO = date.getMonth() + 1;
        if(MO < 10) MO = '0' + MO;
        var DAY = date.getDate();
        if(DAY < 10) DAY = '0' + DAY;

        var result = 0;

        if(chartTypeSales) {
            if(YR in Admin.PaymentTotals && MO in Admin.PaymentTotals[YR] && DAY in Admin.PaymentTotals[YR][MO]) 
                result = Math.round(Admin.PaymentTotals[YR][MO][DAY]);
        }
        else {
            if(YR in Admin.NewTicketCount && MO in Admin.NewTicketCount[YR] && DAY in Admin.NewTicketCount[YR][MO]) 
                result = Admin.NewTicketCount[YR][MO][DAY];
        }

        if(i < 7) twoWeeks.push(result);
        else if(i < 14) lastWeek.push(result);
        else thisWeek.push(result);
    }
    final[0] = twoWeeks; final[1] = lastWeek; final[2] = thisWeek;
    return final;
}

function GetMonthlySales() {
    var final = {};
    for(tot = 0; tot < 3; tot++) {
        var YR = new Date().getFullYear();
        var MO = new Date().getMonth() + 1;
        MO -= tot;
        if(MO == 0) { MO = 12; YR -= 1; }
        else if(MO == -1) { MO = 11; YR -= 1; }
        var MOupdate = MO;
        if(MO < 10) { MOupdate = '0' + MO; }

        var thisMonth = [];
        var numDays = GetDaysOfMonth(MO);
        for(var i = 1; i <= numDays; i++) {
            var day = i;
            if(i < 10) day = '0' + i;
            if(chartTypeSales) {
                if(YR in Admin.PaymentTotals && MOupdate in Admin.PaymentTotals[YR] && day in Admin.PaymentTotals[YR][MOupdate]) 
                    thisMonth.push(Math.round(Admin.PaymentTotals[YR][MOupdate][day]));
                else thisMonth.push(0);
            }
            else {
                if(YR in Admin.NewTicketCount && MOupdate in Admin.NewTicketCount[YR] && day in Admin.NewTicketCount[YR][MOupdate]) 
                    thisMonth.push(Admin.NewTicketCount[YR][MOupdate][day]);
                else thisMonth.push(0);
            }
        }
        final[tot] = thisMonth;
    }
    return final;
}

function GetDaysOfMonth(month) {
    if(month == 2) return 28;
    else if(month == 4 || month == 6 || month == 9 || month == 11) return 30;
    else return 31;
}

function UpdateChartHeader() {
    var timeType = 'Month';
    if(chartBasisWeekly) timeType = 'Week'
    var content = `
        <div style="display: flex; align-items: center; padding: calc(var(--inner-padding) / 2) 0;">
            <div style="width: 1vw; height: 1vw; border: 3px solid blue; border-radius: .5vw; margin-right: 8px;"></div>
            <div style="font-size: max(10px, 1vw); font-weight: 500; color: blue;">This ${timeType}</div>
        </div>
        <div style="display: flex; align-items: center; padding: calc(var(--inner-padding) / 2) 0;">
            <div style="width: 1vw; height: 1vw; border: 3px solid green; border-radius: .5vw; margin-right: 8px;"></div>
            <div style="font-size: max(10px, 1vw); font-weight: 500; color: green;">Last ${timeType}</div>
        </div>
        <div style="display: flex; align-items: center; padding: calc(var(--inner-padding) / 2) 0;">
            <div style="width: 1vw; height: 1vw; border: 3px solid red; border-radius: .5vw; margin-right: 8px;"></div>
            <div style="font-size: max(10px, 1vw); font-weight: 500; color: red;">Two ${timeType}s Ago</div>
        </div>
    `;

    document.getElementById("sales-legend").innerHTML = content;
}

function ChangeReportSalesType() {
    if(document.getElementById("sales-toggle-button").classList.contains("on")) {
        document.getElementById("sales-toggle-button").classList.remove("on");
        document.getElementById("sales-toggle-button").innerHTML = "switch_right";
        chartTypeSales = true;
    }
    else {
        document.getElementById("sales-toggle-button").classList.add("on");
        document.getElementById("sales-toggle-button").innerHTML = "switch_left";
        chartTypeSales = false;
    }
    UpdateReportChart();
}

function ChangeReportBasis() {
    if(document.getElementById("basis-toggle-button").classList.contains("on")) {
        document.getElementById("basis-toggle-button").classList.remove("on");
        document.getElementById("basis-toggle-button").innerHTML = "switch_right";
        chartBasisWeekly = true;
    }
    else {
        document.getElementById("basis-toggle-button").classList.add("on");
        document.getElementById("basis-toggle-button").innerHTML = "switch_left";
        chartBasisWeekly = false;
    }
    UpdateReportChart();
}












function DrawReports() {
    var content = `
    <div class="container">
        <div class="object large">
            <header class="gray">
                <h1>SALES DATA</h1>
            </header>
            <div class="sales-data-container" style="padding: var(--inner-padding);">
                <div style="width: 100%; padding: 0 4%; display: flex; justify-content: space-between;">
                    <div style="display: flex; gap: 1%; align-items: center;">
                        <div style="font-size: 12px; font-weight: 700;">SALES</div>
                        <div id="sales-toggle-button" class="material-symbols-outlined" style="font-size: 32px;" onclick="ChangeReportSalesType()">switch_right</div>
                        <div style="font-size: 12px; font-weight: 700;">TICKETS</div>
                    </div>
                    <div style="display: flex; gap: 1%; align-items: center;">
                        <div style="font-size: 12px; font-weight: 700;">WEEKLY</div>
                        <div id="basis-toggle-button" class="material-symbols-outlined on" style="font-size: 32px;" onclick="ChangeReportBasis()">switch_left</div>
                        <div style="font-size: 12px; font-weight: 700;">MONTHLY</div>
                    </div>
                </div>
                <div id="sales-legend" style="display: flex; gap: max(22px, 3vw); justify-content: center; "></div>
                <canvas id="sales-chart"></canvas>
            </div>
        </div>
        <div id="ticket-left-column">
            <div class="object large">
                <header class="gray">
                    <h1>RECENT INVOICES</h1>
                    <button class="icon-box" onclick=""><div class="material-symbols-outlined">edit_square</div></a>
                </header>
                <div id="recent-invoices-container" style="padding: var(--inner-padding);"></div>
            </div>
            <div class="object large">
                <header class="gray">
                    <h1>NOTES</h1>
                    <button class="icon-box" onclick="TicketAddNote()"><div class="material-symbols-outlined">add</div></button>
                </header>
                <div id="ticket-notes"></div>
            </div>
        </div>
        <div id="ticket-right-column">
            <div class="object large">
                 <header class="gray">
                    <h1>REPAIRS</h1>
                    <button class="icon-box" onclick="TicketAddRepair()"><div class="material-symbols-outlined">add</div></button>
                </header>
                <div id="ticket-repair-container"></div>
            </div>
            <div style="display: flex; width: 100%; flex-wrap: wrap; gap: var(--outer-padding);">
                <div class="object medium">
                    <header id="payment-summary-header" class="green">
                        <h1>PAYMENT SUMMARY</h1>
                        <button class="icon-box" onclick="TicketAddPayment()"><div class="material-symbols-outlined">shopping_cart</div></button>
                    </header>
                    <div id="payment-summary-container" style="padding: var(--inner-padding); text-align: center;"></div>
                </div>
                <div class="object medium">
                    <header class="yellow">
                        <h1 style="justify-content: center;">INVOICES</h1>
                    </header>
                    <div id="ticket-invoices-container""></div>
                </div>
            </div>
        </div>
        
    </div>
    `;
    $("#frame").html(content);
}
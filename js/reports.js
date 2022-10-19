var myChart;
var chartTypeSales = true;
var chartBasisWeekly = false;
var recentCompleted = {};
var recentInvoices = {};
var dailyAvgYear = true;

function InitReports() {
    document.getElementById("page-title").innerHTML = "REPORTS & INVOICES";
    document.getElementById("mobile-page-title").innerHTML = "REPORTS & INVOICES";
    DrawReports();
    DrawSalesData();
    DrawCustomInvoice();
    GetRecentInvoices();
    GetRecentCompletedTickets();
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
            if("PaymentTotals" in Admin && YR in Admin.PaymentTotals && MO in Admin.PaymentTotals[YR] && DAY in Admin.PaymentTotals[YR][MO]) 
                result = Math.round(Admin.PaymentTotals[YR][MO][DAY]);
        }
        else {
            if("NewTicketCount" in Admin && YR in Admin.NewTicketCount && MO in Admin.NewTicketCount[YR] && DAY in Admin.NewTicketCount[YR][MO]) 
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
                if("PaymentTotals" in Admin && YR in Admin.PaymentTotals && MOupdate in Admin.PaymentTotals[YR] && day in Admin.PaymentTotals[YR][MOupdate]) 
                    thisMonth.push(Math.round(Admin.PaymentTotals[YR][MOupdate][day]));
                else thisMonth.push(0);
            }
            else {
                if("NewTicketCount" in Admin && YR in Admin.NewTicketCount && MOupdate in Admin.NewTicketCount[YR] && day in Admin.NewTicketCount[YR][MOupdate]) 
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
            <div style="width: 1vw; height: 1vw; border: 3px solid red; border-radius: .5vw; margin-right: 8px;"></div>
            <div style="font-size: max(10px, 1vw); font-weight: 500; color: red;">This ${timeType}</div>
        </div>
        <div style="display: flex; align-items: center; padding: calc(var(--inner-padding) / 2) 0;">
            <div style="width: 1vw; height: 1vw; border: 3px solid green; border-radius: .5vw; margin-right: 8px;"></div>
            <div style="font-size: max(10px, 1vw); font-weight: 500; color: green;">Last ${timeType}</div>
        </div>
        <div style="display: flex; align-items: center; padding: calc(var(--inner-padding) / 2) 0;">
            <div style="width: 1vw; height: 1vw; border: 3px solid blue; border-radius: .5vw; margin-right: 8px;"></div>
            <div style="font-size: max(10px, 1vw); font-weight: 500; color: blue;">Two ${timeType}s Ago</div>
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

async function GetRecentCompletedTickets() {
    var recents = GetDescending(Admin.RecentlyCompletedTickets, 10);
    for(var outer in recents) {
        for(var key in recents[outer]) {
            var tick = recents[outer][key].toString().substring(0,6);
            var customer = recents[outer][key].toString().substring(6);
            var repairDescription = '';
            for(var key in Customers[customer].Tickets) {
                if(key == parseInt(tick)) repairDescription = Customers[customer].Tickets[key];
            }

            var data = {"Ticket" : parseInt(tick), "Name" : Customers[customer].Name, "Description" : repairDescription };
            recentCompleted[outer] = data;
        }
    }
    DrawRecentCompletedTickets();
}

async function GetRecentInvoices() {
    var recents = GetDescending(Admin.RecentInvoices, 10);
    for(var outer in recents) {
        for(var key in recents[outer]) {
            var year = key.substring(0, 4);
            var month = key.substring(4, 6);
            var day = key.substring(6, 8);
            await db.ref("Invoices/" + year + "/" + month + "/" + day).child(recents[outer][key]).once('value').then(snap => { 
                var ticketResponse = snap.val();
                recentInvoices[outer] = ticketResponse;
            });
        }
    }
    DrawRecentInvoices();
}

function AdjustEndDate(date) {
    document.getElementById("end-date").min = date;
}

function AdjustStartDate(date) {
    document.getElementById("start-date").max = date;
}

function StartCustomInvoiceSearch() {
    var startDate = document.getElementById("start-date").value;
    var endDate = document.getElementById("end-date").value;
    startDate = startDate.substring(0,4) + startDate.substring(5,7) + startDate.substring(8,10);
    endDate = endDate.substring(0,4) + endDate.substring(5,7) + endDate.substring(8,10);
    
    var url = window.location.toString();
    url = url.split('#')[0];
    location.href = url + `#custom-invoice?${startDate}&${endDate}`;
}

function ChangeDailyAVG() {
    if(document.getElementById("daily-avg-link").innerHTML =='ALL-TIME') {
        document.getElementById("daily-avg-link").innerHTML = 'THIS YEAR';
        dailyAvgYear = false;
    }
    else {
        document.getElementById("daily-avg-link").innerHTML = 'ALL-TIME';
        dailyAvgYear = true;
    }
    DrawSalesData();
}

function DrawSalesData() {
    var days = [0,0,0,0,0,0,0];
    var dayCounter = [0,0,0,0,0,0,0];

    if("PaymentTotals" in Admin) {
        var yr = [], mo = [], dy = [];
        var lowYr, lowMo, lowDy;
        for(var year in Admin.PaymentTotals) yr.push(parseInt(year));
        yr.sort(function(a, b) { return a - b; });
        lowYr = yr[0];
        for(var month in Admin.PaymentTotals[lowYr]) mo.push(parseInt(month));
        mo.sort(function(a, b) { return a - b; });
        var moRemix = mo[0];
        if(moRemix < 10) moRemix = '0' + moRemix;
        lowMo = mo[0] - 1;
        for(var day in Admin.PaymentTotals[lowYr][moRemix]) dy.push(parseInt(day));
        dy.sort(function(a, b) { return a - b; });
        lowDy = dy[0];
        var firstDay = lowYr.toString() + lowMo.toString() + lowDy.toString();

        var today = new Date();
        var current = today.getFullYear().toString() + today.getMonth().toString() + today.getDate().toString();
        var lastYear = today.getFullYear().toString() + '01';
        var counter = 0;
        loop1: while(current != firstDay) {
            var newDay = new Date();
            newDay.setDate(newDay.getDate() - counter);
            var year = newDay.getFullYear().toString();
            var month = (newDay.getMonth() + 1).toString();
            if(month < 10) month = '0' + month;
            var day = newDay.getDate().toString();
            if(day < 10) day = '0' + day;
            var dayOfWeek = newDay.getDay();
            current = newDay.getFullYear().toString() + newDay.getMonth().toString() + newDay.getDate().toString();
            
            if(year in Admin.PaymentTotals && month in Admin.PaymentTotals[year] && day in Admin.PaymentTotals[year][month]) 
                days[dayOfWeek] += Admin.PaymentTotals[year][month][day];
            dayCounter[dayOfWeek] += 1;
            counter++;

            if(dailyAvgYear && (current == lastYear || counter > 365)) break loop1;
        }
    }

    var content = '<div style="display: flex; align-items: center; flex-wrap: wrap; justify-content: center; gap: var(--inner-padding);">';
    var dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    for(var i = 0; i < dayCounter.length; i++) {
        var total = 0;
        if(dayCounter[i] != 0) total = Math.round(days[i] / dayCounter[i]);
        
        content += `
            <div style="width: calc(100vw * .08); min-width: 80px; text-align: center;">
                <div style="font-size: 12px; font-weight: 700;">${dayNames[i]}</div>
                <div style="font-size: 18px; font-weight: 700;">$${total}</div>
            </div>
        `;
    }
    content += '</div>';
    document.getElementById("sales-data-container").innerHTML = content;
}

function DrawCustomInvoice() {
    var todaysDate = DateConvert();
    var maxDate = todaysDate.substring(0,4) + "-" + todaysDate.substring(4,6) + "-" + todaysDate.substring(6,8);
    var content = `
        <form style="width: 100%; height: 100%;" onsubmit="StartCustomInvoiceSearch(); return false;">        
            <div style="display: flex; width: 100%; justify-content: center; align-items: center; gap:var(--inner-padding);">
                <div style="width: 160px;">
                    <div style="font-size: 12px; font-weight: 700; padding: 0 0 3px var(--inner-padding);">Start Date</div>
                    <input type="date" required class="custom-invoice-date" onchange="AdjustEndDate(this.value)" id="start-date" max="${maxDate}" >
                </div>
                <div style="width: 160px;">
                <div style="font-size: 12px; font-weight: 700; padding: 0 0 3px var(--inner-padding);">End Date</div>
                    <input type="date" required class="custom-invoice-date" onchange="AdjustStartDate(this.value)" id="end-date" max="${maxDate}">
                </div>
            </div>
            <div style="width: 100%; display: flex; justify-content: center; padding: var(--inner-padding);">
                <button>Submit</button>
            </div>
        </form>
    `;

    document.getElementById("custom-invoice-container").innerHTML = content;
}

function DrawRecentInvoices() {
    var content = '';
    for(var outer in recentInvoices) {
        var type = 'shopping_bag';
        if("Type" in recentInvoices[outer] && recentInvoices[outer].Type == "Card") type = 'credit_card';
        else if("Type" in recentInvoices[outer] && recentInvoices[outer].Type == "Cash") type = 'payments';
        var date = recentInvoices[outer].FullDate.toString();
        var datePrinted = date.substring(4,6) + "/" + date.substring(6, 8) + "/" + date.substring(2,4);
        var ticket = `<div class="recent-invoices-ticket-num">POS</div>`;
        if('Ticket' in recentInvoices[outer]) ticket = `<a href="#ticket-${recentInvoices[outer].Ticket}" class="recent-invoices-ticket-num">#${recentInvoices[outer].Ticket}</a>`;
        var note = '';
        if('Note' in recentInvoices[outer] && recentInvoices[outer].Note != '') note = `&nbsp;&nbsp;(${recentInvoices[outer].Note})`;
        var amount = `<div style="flex-grow: 1; color: var(--default);"><b>$${recentInvoices[outer].Amount.toFixed(2)}</b>${note}</div>`;
        if(recentInvoices[outer].Amount < 0) 
            amount = `<div style="flex-grow: 1; color: darkred;"><b>$${recentInvoices[outer].Amount.toFixed(2)}</b>${note}</div>`;

        
        content += `
            <div style="display: flex; width: 100%; align-items:center; padding: var(--inner-padding) calc(100% / 20); gap: calc(100% / 20); height: 66px;">
                <div style="width: 24px;" class="material-symbols-outlined">${type}</div>
                <div style="width: 84px; text-align: center;">${datePrinted}</div>
                ${amount}
                ${ticket}
            </div>
        `;
    }
    if(document.getElementById('recent-invoices-container')) document.getElementById('recent-invoices-container').innerHTML = content;
}

function DrawRecentCompletedTickets() {
    var content = '';
    for(var outer in recentCompleted) {
        content += `
        <a href="#ticket-${recentCompleted[outer].Ticket}" class="open-ticket-container" style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
            <div class="ticket-num">#${recentCompleted[outer].Ticket}</div>
            <div class="name-device" style="width: calc(100% - (var(--inner-padding) * 2) -86px);">
                <div class="name">${recentCompleted[outer].Name}</div>
                <div class="device" style="max-width: calc(100% - (var(--inner-padding) * 2) -86px);">${recentCompleted[outer].Description}</div>
            </div>
        </a>`;
    }
    document.getElementById('recent-completed-container').innerHTML = content;
}

function DrawReports() {
    var content = `
   
    <div class="container">
        <div class="object medium" style="height: 228px;">
            <header class="gray">
                <h1>CUSTOM INVOICE SEARCH</h1>
            </header>
            <div id="custom-invoice-container" style="padding: var(--inner-padding);"></div>
        </div>
        <div class="object medium" style="height: 228px;">
            <header class="gray">
                <h1>DAILY AVG</h1>
                <div class="tiny-link" id="daily-avg-link" onclick="ChangeDailyAVG()" style="color: darkred;">ALL-TIME</div>
            </header>
            <div id="sales-data-container" style="padding: var(--inner-padding); height: 100%;"></div>
        </div>    
        <div class="object large">
            <header class="gray">
                <h1>SALES CHART</h1>
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
        <div class="object medium">
            <header class="gray">
                <h1>RECENT INVOICES</h1>
                <a href="#invoices" class="tiny-link" style="color: darkred;">SEE ALL</a>
            </header>
            <div id="recent-invoices-container"></div>
        </div>
        <div class="object medium">
            <header class="gray">
                <h1>RECENT COMPLETED TICKETS</h1>
                <a href="#completed-tickets" class="tiny-link" style="color: darkred;">SEE ALL</a>
            </header>
            <div id="recent-completed-container"></div>
        </div>
    </div>
    `;
    $("#frame").html(content);
    pageLoading = false;
}
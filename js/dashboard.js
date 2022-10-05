var possibleColors = ["red", "blue", "goldenrod", "green", "gray", "purple", "brown", "indianred", "lightblue", "lightgreen", "pink", "slategray"];
var dashboardChart;
var chartBasis = 0; // 0: All-time, 1: This year, 2: Last year
var chartType = "All Types";
var chartPercentage = false;
var recentTickets = {};

function InitDashboard() {
    document.getElementById("page-title").innerHTML = "DASHBOARD";
    document.getElementById("mobile-page-title").innerHTML = "DASHBOARD";
    DrawDashboard();
    GetRecentOpenTickets();
    CreateDashboardChart();
    UpdateChartOptions();
    UpdateDashboardChart();
    DrawCurrentStatus();
    DrawSecondScreenStatus();
}

function CreateDashboardChart() {
    dashboardChart = new Chart("dashboard-chart", {
        type: 'doughnut',
        plugins: [ChartDataLabels]
    });
}

function UpdateDashboardChart() {
    var chartResults = GetChartInformation();

    var chartLabels = [];
    var chartData = [];
    var chartColor = [];

    if(chartPercentage) {
        var total = 0;
        for(var index in chartResults) {
            for(var key in chartResults[index]) total += chartResults[index][key];
        }
        for(var index in chartResults) {
            for(var key in chartResults[index]) {
                chartLabels.push(key);
                var percent = Math.round((chartResults[index][key] / total) * 100);
                chartData.push(percent);
            }
        }
    }
    else {
        for(var index in chartResults) {
            for(var key in chartResults[index]) {
                chartLabels.push(key);
                chartData.push(chartResults[index][key]);
            }
        }
    }
    for(var i = 0; i < chartLabels.length; i++) chartColor.push(possibleColors[i]);
    var fontSize = parseInt(20 - chartData.length);

    const data = {
        labels: chartLabels,
        datasets: [{
            data: chartData,
            backgroundColor: chartColor,
            hoverOffset: 4,
            label: 'test'
        }]
    };
    dashboardChart.options.plugins.labels.fontSize = fontSize;
    dashboardChart.data = data;
    dashboardChart.update();
}

function GetChartInformation() {
    var currentYear = new Date().getFullYear();
    var returnObject = {};

    if(chartType == "All Types") {
        for(var year in Admin.TypeCounts) {
            if(chartBasis == 0 || (chartBasis == 1 && year == currentYear) || (chartBasis == 2 && year == currentYear - 1)) {
                for(var type in Admin.TypeCounts[year]) {
                    var total = 0;
                    for(var device in Admin.TypeCounts[year][type]) total += Admin.TypeCounts[year][type][device];
                    if(returnObject.hasOwnProperty(type)) returnObject[type] += total;
                    else returnObject[type] = total;
                }
            }
        }
    }
    else {
        for(var year in Admin.TypeCounts) {
            if(chartBasis == 0 || (chartBasis == 1 && year == currentYear) || (chartBasis == 2 && year == currentYear - 1)) {
                for(var type in Admin.TypeCounts[year]) {
                    if(type == chartType) {
                        for(var device in Admin.TypeCounts[year][type]) {
                            if(returnObject.hasOwnProperty(device)) returnObject[device] += Admin.TypeCounts[year][type][device];
                            else returnObject[device] = Admin.TypeCounts[year][type][device];
                        }
                    }
                }
            }
        }
    }

    var sorted = SortChartObject(returnObject);
    return sorted;
}

function SortChartObject(obj) {
    let sortable = [];
    var returnObject = {};

    for (var key in obj) {
        sortable.push([key, obj[key]]);
    }
    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });
    if(sortable.length > 12) sortable.length = 12;
    for(var i = 0; i < sortable.length; i++) {
        returnObject[i] = { [sortable[i][0]] : sortable[i][1] };
    }
    return returnObject;
}

function GetDashboardDropdowns() {
    var typeList = [];
    for(var year in Admin.TypeCounts) {
        for(var type in Admin.TypeCounts[year]) {
            if(!typeList.includes(type)) typeList.push(type);
        }
    }

    var selected = '';
    if(chartType == "All Types") selected = ' selected';
    var content = `
        <div><div style="font-size: 10px; font-weight: 700; padding: 0 0 4px 8px;">Device Data</div>
        <div class="selectdiv" style="margin:0"><label><select onchange="chartType = this.value; UpdateDashboardChart()">
            <option value="All Types"${selected}>All Types</option>`;
    for(var i = 0; i < typeList.length; i++) {
        if(chartType == typeList[i]) { selected = ' selected'; console.log("Got one"); }
        else selected = '';
        content += `<option value="${typeList[i]}"${selected}>${typeList[i]}</option>`;
    }
    content += '</select></label></div></div>';

    var option = '<option value="0" selected>All Time</option><option value="1">This Year</option><option value="2">Last Year</option>';
    if(chartBasis == 1) option = '<option value="0">All Time</option><option value="1" selected>This Year</option><option value="2">Last Year</option>';
    else if(chartBasis == 2) option = '<option value="0">All Time</option><option value="1">This Year</option><option value="2" selected>Last Year</option>';
    content += `
    <div><div style="font-size: 10px; font-weight: 700; padding: 0 8px 4px 0; text-align: right;">Time Range</div>
        <div class="selectdiv" style="margin:0"><label><select onchange="chartBasis = this.value; UpdateDashboardChart()">
        ${option}
        </select></label></div>
    </div>`;
    return content;
}

function ChangeGraphPercent(element, isPercent) {
    var theSwitches = document.getElementsByClassName("number-percent-switch");
    for(var i = 0; i < theSwitches.length; i++) theSwitches[i].classList.remove("selected");
    element.classList.add("selected");
    if(isPercent != chartPercentage) {
        chartPercentage = isPercent;
        UpdateChartOptions();
        UpdateDashboardChart();
    }
}

async function GetRecentOpenTickets() {
    var recents = GetDescending(OpenTickets, 5);
    for(var outer in recents) {
        for(var key in recents[outer]) {
            await db.ref("Tickets").child(key).once('value').then(snap => { 
                var ticketResponse = snap.val();
                var repairDescription = GetRepairDescription(ticketResponse);
                var data = {"Ticket" : parseInt(key), "Name" : Customers[ticketResponse.Customer].Name, "Description" : repairDescription };
                recentTickets[outer] = data;
            });
        }
    }
    DrawRecentOpenTickets();
}


function DrawSecondScreenStatus() {
    var connectionCode = 483921; //Change to actual code when implemented
    var status = 'tv_off'; // Same as above
    var statusText = 'Not Connected';
    var statusColor = 'darkred'
    //if(CONNECTED) { status = 'connected_tv'; statusText = 'Connected'; statusColor = 'darkgreen'; }

    var content = `
    <div style="display: flex; width: 100%; height: calc((383px - 108px - var(--outer-padding)) * .5); justify-content: center; align-items: center; text-align: center;">
        <div style="flex-grow: 1;">
            <div style="font-size: 14px; font-weight: 700; padding-bottom: 4px;">STATUS</div>
            <div style="font-size: 34px; font-weight: 700; color: ${statusColor}" class="material-symbols-outlined">${status}</div>
            <div style="font-size: 10px; font-weight: 500; color: ${statusColor}">${statusText}</div>
        </div>
        <div style="flex-grow: 1;">
            <div style="font-size: 14px; font-weight: 700;">CONNECTION CODE</div>
            <div style="font-size: 24px; font-weight: 700;">${connectionCode}</div>
        </div>
    </div>
    `;

    document.getElementById("second-screen-status-container").innerHTML = content;
}

function DrawCurrentStatus() {
    var date = DateConvert();
    var year = date.substring(0,4);
    var month = date.substring(4,6);
    var day = date.substring(6, 8);
    var sales = 0;
    if("PaymentTotals" in Admin &&year in Admin.PaymentTotals && month in Admin.PaymentTotals[year] && day in Admin.PaymentTotals[year][month]) 
        sales = Admin.PaymentTotals[year][month][day];
    var tickets = 0;
    if(OpenTickets != null) tickets = Object.keys(OpenTickets).length;
    
    var content = `
    <div style="display: flex; width: 100%; height: calc((383px - 108px - 32px) * .5); justify-content: center; align-items: center; text-align: center;">
        <div style="flex-grow: 1;">
            <div style="font-size: 14px; font-weight: 700;">TODAY'S SALES</div>
            <div style="font-size: 24px; font-weight: 700;">$${sales.toFixed(2)}</div>
        </div>
        <div style="flex-grow: 1;">
            <div style="font-size: 14px; font-weight: 700;"># OF OPEN TICKETS</div>
            <div style="font-size: 24px; font-weight: 700;">${tickets}</div>
        </div>
    </div>
    `;
    
    
    document.getElementById("current-status-container").innerHTML = content;
}

function DrawRecentOpenTickets() {
    var content = '';
    for(var outer in recentTickets) {
        content += `
        <a href="#ticket-${recentTickets[outer].Ticket}" class="open-ticket-container" style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
            <div class="ticket-num">#${recentTickets[outer].Ticket}</div>
            <div class="name-device" style="width: calc(100% - (var(--inner-padding) * 2) -86px);">
                <div class="name">${recentTickets[outer].Name}</div>
                <div class="device" style="max-width: calc(100% - (var(--inner-padding) * 2) -86px);">${recentTickets[outer].Description}</div>
            </div>
        </a>`;
    }
    if(content != '') document.getElementById('recent-tickets-container').innerHTML = content;
}

function DrawDashboard() {
    var dropdown = GetDashboardDropdowns();
    var content = `
    <div class="container">
        <div class="object medium" style="gap: var(--outer-padding); background-color: transparent; border: 0; box-shadow: none;">
            <div class="object large">
                <header class="green">
                    <h1>CURRENT STATUS</h1>
                    <button class="icon-box" onclick="DrawCurrentStatus()"><div class="material-symbols-outlined">refresh</div></button>
                </header>
                <div id="current-status-container"></div>
            </div>
            <div class="object large">
                <header class="yellow">
                    <h1>2ND SCREEN ID</h1>
                    <button class="icon-box" onclick="DrawSecondScreenStatus()"><div class="material-symbols-outlined">refresh</div>
                </header>
                <div id="second-screen-status-container"></div>
            </div>
        </div>
        <div class="object medium" style="height: 383px; max-height: 383px;">
            <header class="gray">
                <h1>RECENT OPEN TICKETS</h1>
            </header>
            <div id="recent-tickets-container"><div class="default-none">- NO OPEN TICKETS -</div></div>
        </div>
        <div class="object medium">
            <header class="gray">
                <h1>SALES DATA</h1>
            </header>
            <div style="padding: var(--inner-padding); display: flex; flex-direction: column; align-items: center;">
                <div style="display: flex; justify-content: space-between; width: 100%;">${dropdown}</div>
                <div style="width: 100%; max-width: 400px;"><canvas id="dashboard-chart"></canvas></div>
                <div style="width: 100%; display: flex; justify-content: flex-end; margin: -20px var(--inner-padding) 0 0;">
                    <div style="width: 60px; height: 20px; border: 1px solid var(--default); border-radius: 4px; display: flex;">
                        <div class="number-percent-switch selected" style="border-right: 1px solid var(--default)" onclick="ChangeGraphPercent(this, false)">#</div>
                        <div class="number-percent-switch" onclick="ChangeGraphPercent(this, true)">%</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="object medium">
            <header class="gray">
                <h1>NOTES</h1>
                <button class="icon-box" onclick="TicketAddNote()"><div class="material-symbols-outlined">add</div></button>
            </header>
            <div id="ticket-notes"><div class="default-none">- NO NOTES -</div></div>
        </div>
    </div>
    `;
    $("#frame").html(content);
}
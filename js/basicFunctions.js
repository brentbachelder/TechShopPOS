// Variables
var currentPage;
const pageList = ["new-repair", "open-tickets", "reports", "pos", "part-orders", "settings-general", "settings-customers", "settings-tickets", "settings-dual"];
const menu = document.getElementById("menu");
const customerRatingColor = ['', 'red', 'lightcoral', 'gray', 'lightgreen', 'green'];
var pageLoading = false;
var readyToPrint = true;


// Listener for page changes
window.addEventListener('hashchange', GetNewHash);

function GetNewHash(event) {
    var newPage = event.newURL.toString();
    newPage = newPage.split("#")[1];
    ChangePage(newPage);
}


// Listener for mouse clicks
window.addEventListener('click', ClickFunctions);

function ClickFunctions(event) {
    var dic = document.getElementById('dropdown-icon-container');
    if(!dic.classList.contains('hidden') && !document.getElementById('dropdown-dots').contains(event.target)) dic.classList.add('hidden');
}




// Actual Page Change function
function ChangePage(newPage) {
    if(finishedLoading) {
        if(newPage != currentPage && !pageLoading) {
            pageLoading = true;
            CloseMenu();
            ShowLoading();

            if(newPage == "new-repair") InitNewRepair();
            else if(newPage == "open-tickets") InitOpenTickets();
            else if(newPage == "parts") InitPartOrders();
            else if(newPage == "pos") InitPos();
            else if(newPage == "reports") InitReports();
            else if(newPage.includes("custom-invoice")) {
                var startCustom = newPage.substring(newPage.indexOf("?") + 1, newPage.lastIndexOf("&"));
                var endCustom = newPage.split('&')[1];
                InitCustomInvoice(startCustom, endCustom);
            }
            else if(newPage.includes("invoices")) {
                if(newPage.includes("?page")) {
                    var page = newPage.substring(13);
                    InitInvoices(page);
                }
                else InitInvoices();
            }
            else if(newPage.includes("completed-tickets")) {
                if(newPage.includes("?page")) {
                    var page = newPage.substring(22);
                    InitCompletedTickets(page);
                }
                else InitCompletedTickets();
            }
            else if(newPage.includes("settings")) {
                if(document.getElementById("menu-settings").classList.contains("hidden")) {
                    document.getElementById("menu-settings").classList.remove("hidden");
                    document.getElementById("settings-arrow").classList.remove("hidden");
                }
                const after = newPage.substring(newPage.indexOf('-') + 1);
                InitSettings(after);
            }
            else if(newPage.includes("customer"))  {
                var pageID = newPage.split('-')[1];
                InitCustomer(pageID);
            }
            else if(newPage.includes("ticket"))  {
                var pageID = newPage.split('-')[1];
                InitTicket(pageID);
            }
            else InitDashboard();

            var selected = menu.getElementsByClassName("selected");
            for(var i = 0; i < selected.length; i++) selected[i].classList.remove("selected");
            if(pageList.indexOf(newPage) > -1) document.getElementById(newPage).classList.add("selected");

            currentPage = newPage;
        }
    }
    else InitializeApp();
}

function ShowLoading() {
    document.getElementById("frame").innerHTML = `<div class="small-loading-container"><div class="lds-grid"><div></div><div></div><div></div><div></div><div>
        </div><div></div><div></div><div></div><div></div></div></div>`;
}



// Dark theme functions
function InitializeDarkTheme() {
    var dt = JSON.parse(window.localStorage.getItem('darkTheme'));
    if(dt) {
        document.body.classList.add("dark-theme");
        document.getElementById("dark-mode-switch").innerHTML = "toggle_on";
    }
}

function ChangeDarkTheme() { // Initialize Dark Theme is in firebaseFunctions
    if(document.body.classList.contains("dark-theme")) {
        document.body.classList.remove("dark-theme");
        document.getElementById("dark-mode-switch").innerHTML = "toggle_off";
        document.getElementById("dark-mode-switch-mobile").innerHTML = "toggle_off";
        document.getElementById("dark-mode-switch-mobile-dropdown").innerHTML = "toggle_off";
        localStorage.setItem('darkTheme', false);
    }
    else {
        document.body.classList.add("dark-theme");
        document.getElementById("dark-mode-switch").innerHTML = "toggle_on";
        document.getElementById("dark-mode-switch-mobile").innerHTML = "toggle_on";
        document.getElementById("dark-mode-switch-mobile-dropdown").innerHTML = "toggle_on";
        localStorage.setItem('darkTheme', true);
    }
}



// Toggle, Open, and Close Menu
function ToggleMenu() {
    if(menu.classList.contains("hidden")) OpenMenu();
    else CloseMenu();
}

function CloseMenu() {
    menu.classList.add("hidden");
    document.getElementById("click-out").classList.add("hidden");
    document.getElementById("mobile-header").classList.remove("menu-open");
    document.getElementById("mobile-name-icon-container").classList.remove("menu-open");
    document.getElementById("menu-button").innerHTML = "menu";
    if(!document.getElementById("menu-settings").classList.contains("hidden")) {
        document.getElementById("menu-settings").classList.add("hidden");
        document.getElementById("settings-arrow").classList.add("hidden");
    }
}

function OpenMenu() {
    menu.classList.remove("hidden");
    document.getElementById("click-out").classList.remove("hidden");
    document.getElementById("mobile-header").classList.add("menu-open");
    document.getElementById("mobile-name-icon-container").classList.add("menu-open");
    document.getElementById("menu-button").innerHTML = "close";
}

function OpenDropdownIcons() {
    document.getElementById("dropdown-icon-container").classList.toggle("hidden");
}

function OpenSettings() {
    document.getElementById("menu-settings").classList.toggle("hidden");
    document.getElementById("settings-arrow").classList.toggle("hidden");
}

function CheckboxToggle(element, fromNewTicket = false) {
    element.classList.toggle("selected");
    if(fromNewTicket)  {
        if(element.classList.contains("selected")) TemporaryNewTicketCheckboxes.push(element.id);
        else {
            for( var i = 0; i < TemporaryNewTicketCheckboxes.length; i++){ 
                if(TemporaryNewTicketCheckboxes[i] == element.id) TemporaryNewTicketCheckboxes.splice(i, 1); 
            }
        }
    }
}



// Enter key blurs input
function OnEnterBlur(event) {
    var id = event.target.id;
    var key = event.keyCode;
    if(key == 13) document.activeElement.blur();
    if((id.includes("Phone") || id.includes("Phone")) && key != 8 && key != 46) {
        var value = event.target.value;
        value = value.replace(/-/g, '');
    
        if(value.length > 3 && value.length <= 6) 
            value = value.slice(0,3) + "-" + value.slice(3);
        else if(value.length > 6) 
            value = value.slice(0,3) + "-" + value.slice(3,6) + "-" + value.slice(6);
        event.target.value = value;
    }
}



// Get Repair Description (Brand Model - Repair, Repair)
function GetRepairDescription(ticketObject, justRepairs = false) {
    var description = ticketObject.Device + ' ' + ticketObject.Type + ' - ';
    if(justRepairs) description = '';
    var line = '';
    if('Repairs' in ticketObject) {
        var length = Object.keys(ticketObject.Repairs).length;
        var counter = 0;
        for(var i in ticketObject.Repairs) {
            if(length > counter + 2) line += ticketObject.Repairs[i].Display + ', ';
            else if(length > counter + 1) line += ticketObject.Repairs[i].Display + ' & ';
            else line += ticketObject.Repairs[i].Display;
            counter++;
        }
    }
    
    description += line;
    return description;
}



// Retrieve Date formatting and Extrapolation
function DateConvert(full = false) {
    var YR = new Date().getFullYear();
    var MO = new Date().getMonth() + 1;
    if(MO < 10) { MO = '0' + MO; }
    var DAY = new Date().getDate();
    if(DAY < 10) { DAY = '0' + DAY; }
    var HR = new Date().getHours();
    if(HR < 10) { HR = '0' + HR; }
    var MIN = new Date().getMinutes();
    if(MIN < 10) { MIN = '0' + MIN; }
    var result = YR.toString() + MO.toString() + DAY.toString() + HR.toString() + MIN.toString();
    if(full) {
        var SEC = new Date().getSeconds();
        if(SEC < 10) { SEC = '0' + SEC; }
        var result = YR.toString() + MO.toString() + DAY.toString() + HR.toString() + MIN.toString() + SEC.toString();
    }
	return(result);
}

function DateToText(date) {
    date = date.toString();
    var year = date.substring(0,4);
    var month = date.substring(4,6);
    var day = date.substring(6, 8);
    var hour = date.substring(8, 10);
    var minute = date.substring(10, 12);

    const original = new Date(month + "/" + day + "/" + year + " " + hour + ":" + minute);
    var today = new Date();
    var difference = Math.floor((today - original) / (1000 * 60 * 60 * 24));
    var description = difference + " days";
    if(difference < 2) {
        var minutes = Math.floor((today - original) / (1000 * 60));
        if(minutes > 1440) description = "Yesterday";
        else if(minutes < 1) description = "Just now";
        else if(minutes == 1) description = "A minute ago";
        else if(minutes < 60) description = minutes + " minutes";
        else {
            var floor = Math.floor(minutes / 60);
            description = floor + " hour";
            if(floor > 1) description += "s";
        }
    }
    else if(difference > 30) {
        var floor = 0;
        if(difference > 365) { 
            floor = Math.floor(difference / 365);
            if(floor == 1) description = "Over one year";
            else description = "Over " + floor + " years";
        }
        else {
            floor = Math.floor(difference / 30);
            description = floor + " month";
            if(floor > 1) description +="s";
        }
    }
    return description;
}

function SimpleDateToText(date) {
    date = date.toString();
    var newDate = new Date(parseInt(date.substring(0,4)), parseInt(date.substring(4,6)) - 1, parseInt(date.substring(6,8)));
    var daysOfTheWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var weekDay = newDate.getDay();
    var ampm = "AM";
    var hour = parseInt(date.substring(8,10));
    if(hour >= 12) ampm = "PM"
    if(hour > 12) hour -= 12;
    var returnString= daysOfTheWeek[weekDay] + " " + date.substring(4,6) + "-" + date.substring(6,8) + "-" + date.substring(2,4) + " " + hour + ":" + 
        date.substring(10,12) + " " + ampm;
    return returnString;
}



// Create Dropdowns and Apply Status Changes
function StatusDropdown(ticket, current, customer) {
    var content = `<div class="selectdiv"><label><select id="${ticket}-dropdown" onchange="ApplyStatusChange(${ticket}, this.value, ${customer})">`;
    for(var key in Settings.Tickets.Status) {
        var display = Settings.Tickets.Status[key].Display;
        var select = '';

        if(current == display) select = ' selected';
        if(display != "") content += `<option value="${display}"${select}>${display}</option>`;
    }
    content += '</select></label></div>';
    return content;
}

function ApplyStatusChange(ticket, status, customer) {
    db.ref('Tickets/' + ticket).update({Status: status});
    if(status == "Completed") {
        db.ref('OpenTickets/' + ticket).remove();
        delete ticketsInProgress[ticket];
        AddTicketToRecentlyCompleted(ticket, customer);
    }
    else {
        db.ref('OpenTickets/' + ticket).set(status);
        if(ticket in ticketsInProgress) ticketsInProgress[ticket].Status = status;
        for(var key in Admin.RecentlyCompletedTickets) {
            var tck = Admin.RecentlyCompletedTickets[key].toString();
            tck = parseInt(tck.substring(0,6));
            if(tck == ticket) db.ref('Admin/RecentlyCompletedTickets/' + key).remove();
        }
    }
    currentlyUsedStatuses = GetCurrentlyUsedStatuses();
    if(currentPage == "open-tickets") {
        DrawOpenTickets();
        CreateStatusParents(currentlyUsedStatuses);
        DrawIndividualOpenTickets(ticketsInProgress);
    }
}

function AddTicketToRecentlyCompleted(ticket, customer) {
    var date = parseInt(DateConvert(true));
    var tickCust = ticket + '' + customer;
    var intTickCust = parseInt(tickCust);
    console.log(tickCust);
    if('RecentlyCompletedTickets' in Admin) {
        if(Object.keys(Admin.RecentlyCompletedTickets).length < 100) db.ref('Admin/RecentlyCompletedTickets').update({[date] : intTickCust});
        else {
            Admin.RecentlyCompletedTickets[date] = intTickCust;
            var rct = GetDescending(Admin.RecentlyCompletedTickets, 100);
            var newRct = {};
            for(var outer in rct) {
                for(var key in rct[outer]) {
                    newRct[key] = rct[outer][key];
                }
            }
            db.ref('Admin/RecentlyCompletedTickets').set(newRct);
        }
    }
    else db.ref('Admin/RecentlyCompletedTickets').update({[date] : intTickCust});
}

function AddInvoiceToRecent(invoiceNum) {
    var date = parseInt(DateConvert(true));
    if('RecentInvoices' in Admin) {
        var alreadyIn = false;
        for(var key in Admin.RecentInvoices) {
            if(Admin.RecentInvoices[key] == invoiceNum) {
                delete Admin.RecentInvoices[key];
                db.ref('Admin/RecentInvoices/' + key).remove();
                db.ref('Admin/RecentInvoices').update({[date] : invoiceNum});
                alreadyIn = true;
                console.log("refunded");
            }
        }
        if(!alreadyIn) {
            if(Object.keys(Admin.RecentInvoices).length < 10) db.ref('Admin/RecentInvoices').update({[date] : invoiceNum});
            else {
                Admin.RecentInvoices[date] = invoiceNum;
                var rct = GetDescending(Admin.RecentInvoices, 10);
                var newRct = {};
                for(var outer in rct) {
                    for(var key in rct[outer]) {
                        newRct[key] = rct[outer][key];
                    }
                }
                db.ref('Admin/RecentInvoices').set(newRct);
            }
        }
    }
    else db.ref('Admin/RecentInvoices').update({[date] : invoiceNum});
}



// Show message in Message Center
var timeOut;
function MessageCenter(message, secondCount) {
    const messageCenter = document.getElementById("message-center-container");
    document.getElementById("message-box").innerHTML = message;
    if(timeOut !== undefined) clearInterval(timeOut);

    var counter = secondCount * 2;
    timeOut = setInterval(function () {
        if(counter == secondCount * 2) {
            messageCenter.classList.add("show");
        }
        else if(counter == 1) {
            messageCenter.classList.remove("show");
            messageCenter.classList.add("hide");
        }
        else if(counter <= 0) {
            messageCenter.classList.remove("hide");
            clearInterval(timeOut);
        }
        if(counter > 0) counter--;
    }, 500);
}

// Get two digit number
function TwoDigit(number) {
    var x = Math.pow(10, Number(2) + 1);
    return (Number(number) + (1 / x)).toFixed(2);
}

// Get object by descending order
function GetDescending(obj, returnQuantity = -1) {
    let sortable = [];
    var returnObject = {};

    for (var key in obj) {
        sortable.push([key]);
    }
    sortable.sort((a, b) => (b - a));
    if(returnQuantity != -1 && sortable.length > returnQuantity) sortable.length = returnQuantity;
    for(var i = 0; i < sortable.length; i++) {
        returnObject[i] = { [sortable[i]] : obj[sortable[i]] };
    }
    return returnObject;
}
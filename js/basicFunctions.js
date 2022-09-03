// Variables
var currentPage;
const pageList = ["new-repair", "open-tickets", "reports", "pos", "part-orders", "settings-general", "settings-customers", "settings-tickets", "settings-dual"];
const menu = document.getElementById("menu");
const customerRatingColor = ['', 'red', 'lightcoral', 'gray', 'lightgreen', 'green'];


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
        if(newPage != currentPage) {
            CloseMenu();

            if(newPage == "new-repair") InitNewRepair();
            else if(newPage == "open-tickets") InitOpenTickets();
            else if(newPage == "part-orders") InitPartOrders();
            else if(newPage == "pos") InitPos();
            else if(newPage == "reports") InitReports();
            else if(newPage.includes("customer"))  {
                var pageID = newPage.split('-')[1];
                InitCustomer(pageID);
            }
            else if(newPage.includes("ticket"))  {
                var pageID = newPage.split('-')[1];
                InitTicket(pageID);
            }
            else if(newPage.includes("settings")) {
                if(document.getElementById("menu-settings").classList.contains("hidden")) {
                    document.getElementById("menu-settings").classList.remove("hidden");
                    document.getElementById("settings-arrow").classList.remove("hidden");
                }
                const after = newPage.substring(newPage.indexOf('-') + 1);
                InitSettings(after);
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
    var key = event.keyCode;
    if(key == 13) document.activeElement.blur();
}



// Get Repair Description (Brand Model - Repair, Repair)
function GetRepairDescription(ticketObject) {
    var description = ticketObject.Device + ' ' + ticketObject.Type + ' - ';

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
function DateConvert() {
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



// Create Dropdowns and Apply Status Changes
function StatusDropdown(ticket, current) {
    var content = `<div class="selectdiv"><label><select onchange="ApplyStatusChange(${ticket}, this.value)">`;
    for(var key in Settings.Tickets.Status) {
        var display = Settings.Tickets.Status[key].Display;
        var select = '';

        if(current == display) select = ' selected';
        if(display != "") content += `<option value="${display}"${select}>${display}</option>`;
    }
    content += '</select></label></div>';
    return content;
}

function ApplyStatusChange(ticket, status) {
    db.ref('Tickets/' + ticket).update({Status: status});
    if(status == "Completed") db.ref('OpenTickets/' + ticket).remove();
    else db.ref('OpenTickets/' + ticket).set(status);
}
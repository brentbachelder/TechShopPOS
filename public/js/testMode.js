var custNum = 0, custCounter = 0, tickNum = 100301, invNum = 10456;
var TestAdmin = {}, TestCustomers = {}, TestTickets = {}, TestParts = {}, TestInvoices = {}, TestOpenTickets = {};
var TestPaymentTotals = {}, TestRecentlyCompletedTickets = {}, TestRecentInvoices = {}, TestTypeCounts = {};

async function TestMode() {
    var numberOfDaysToCreate = 400;
    var TestNewTicketCount = {};

    for(var i = numberOfDaysToCreate; i >= 0; i--) {
        var dailyRepairNumber = getRandomNumber(2, 10);
        
        // Date information
        var date = new Date();
        date.setDate(date.getDate() - i);
        var YR = date.getFullYear();
        var MO = date.getMonth() + 1;
        if(MO < 10) { MO = '0' + MO; }
        var DAY = date.getDate();
        if(DAY < 10) { DAY = '0' + DAY; }
        if(YR in TestNewTicketCount && MO in TestNewTicketCount[YR]) TestNewTicketCount[YR][MO][DAY] = dailyRepairNumber;
        else if(YR in TestNewTicketCount) TestNewTicketCount[YR][MO] = { [DAY] : dailyRepairNumber };
        else TestNewTicketCount = {[YR] : {[MO] : { [DAY] : dailyRepairNumber }}};

        for(var j = 0; j < dailyRepairNumber; j++) {
            if(i < 8) GenerateNewCustomer(); // If the day is within 8 days of today, customer should be new
            else { 
                var newOrExisting = getRandomNumber(1, 10);
                if(newOrExisting == 5) custNum = getRandomNumber(0, custCounter);
                else GenerateNewCustomer();
            }

            GenerateTicket(DAY, MO, YR, i);
        }
    }

    TestAdmin = {CurrentCustomerNumber : custCounter, CurrentInvoiceNumber : invNum, CurrentTicketNumber : tickNum, NewTicketCount : TestNewTicketCount, PaymentTotals : TestPaymentTotals, RecentInvoices : TestRecentInvoices, RecentlyCompletedTickets : TestRecentlyCompletedTickets, TestMode : true, TypeCounts : TestTypeCounts};
    
    db.ref("Admin").set(TestAdmin);
    db.ref("Customers").set(TestCustomers);
    db.ref("Tickets").set(TestTickets);
    db.ref("Parts").set(TestParts);
    db.ref("Invoices").set(TestInvoices);
    db.ref("OpenTickets").set(TestOpenTickets);
}

function getRandomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

function GenerateNewCustomer() {
    var custObject = {};
    var firstName = firstNames[getRandomNumber(0, firstNames.length)];
    var lastName = lastNames[getRandomNumber(0, lastNames.length)];
    custObject["Name"] = firstName + " " + lastName;
    
    var phoneNum;
    var phoneRand = getRandomNumber(0, 4);
    if(phoneRand == 0) phoneNum = "480";
    else if(phoneRand == 1) phoneNum = "602";
    else if(phoneRand == 2) phoneNum = "520";
    else phoneNum = getRandomNumber(200, 988).toString();
    phoneNum += "-555-" + getRandomNumber(1000, 9999).toString();
    custObject["Phone"] = phoneNum;

    var emailRandom = getRandomNumber(0, 2);
    if(emailRandom == 1) custObject["Email Address"] = firstName.toLocaleLowerCase() + lastName.toLocaleLowerCase() + "@fake.com";
    
    custObject["Rating"] = 3;

    custNum = custCounter;
    custCounter++;
    TestCustomers[custNum] = custObject;
}

function GenerateTicket(day, month, year, dayNum) {
    var TestRepairs = {};
    
    var randomHour = getRandomNumber(10, 19);
    var randomMinute = getRandomNumber(10, 60);
    var randomSecond = getRandomNumber(10, 60);
    var date = year.toString() + month.toString() + day.toString() + randomHour.toString() + randomMinute.toString() + randomSecond.toString();
    
    var testDeviceRand = getRandomNumber(0, 100);
    var testDevice, testType, testRepair, testPrice, testStatus;
    if(testDeviceRand >= 40) testDevice = "1000Apple";
    else if(testDeviceRand >= 25) testDevice = "1004Computer";
    else if(testDeviceRand >= 15) testDevice = "1001Samsung";
    else if(testDeviceRand >= 8) testDevice = "1002Google";
    else testDevice = "1003LG";

    var typeCount = Object.keys(TestPrices[testDevice]).length;
    var testTypeRand = getRandomNumber(0, typeCount);
    let count = 0;
    for(var types in TestPrices[testDevice]) {
        if(count == testTypeRand) testType = types;
        count++;
    }

    if(year in TestTypeCounts && testDevice.slice(4) in TestTypeCounts[year] && testType.slice(4) in TestTypeCounts[year][testDevice.slice(4)]) TestTypeCounts[year][testDevice.slice(4)][testType.slice(4)] += 1;
    else if(year in TestTypeCounts && testDevice.slice(4) in TestTypeCounts[year]) TestTypeCounts[year][testDevice.slice(4)][testType.slice(4)] = 1;
    else if(year in TestTypeCounts) TestTypeCounts[year][testDevice.slice(4)] = {[testType.slice(4)] : 1};
    else TestTypeCounts[year] = {[testDevice.slice(4)] : {[testType.slice(4)] : 1}};

    
    if(testDevice == "1004Computer") {
        var testComputerRand = getRandomNumber(0, 3);
        if(testComputerRand == 0) testRepair = "1001PC Tune-up";
        else if(testComputerRand == 1) testRepair = "1002Hard Drive";
        else testRepair = "1003Diagnostic";
    }
    else {
        var testRepairRand = getRandomNumber(0, 10);
        if(testRepairRand >= 4) testRepair = "1001LCD";
        else if(testRepair >= 1) testRepair = "1002Battery";
        else testRepair = "1003Charge Port";
    }
    
    testPrice = TestPrices[testDevice][testType][testRepair].Price;
    var testPriceFinal = parseFloat((testPrice * 1.075).toFixed(2));

    TestRepairs[0] = {DiscountDollar : 0, DiscountPercent : 0, Display : testRepair.slice(4), OrderDate : "", Ordered : "Not Ordered", Price : testPrice, Quantity : 1, Tax : true };

    var partOrderRand = getRandomNumber(0, 2);
    if(testDevice != "1000Apple" && testDevice != "1004Computer" && partOrderRand == 1 && dayNum < 8) {
        testStatus = "Waiting for Parts";
        TestParts[date] = {Description : testDevice.slice(4) + " " + testType.slice(4) + " " + testRepair.slice(4), RepairNumber : 0, Ticket : tickNum, Tracking : "" };
        TestRepairs[0].OrderDate = date;
        TestRepairs[0].Ordered = "Ordered";
    }
    else {
        if(dayNum < 8) {
            var statusRand = getRandomNumber(0, 100);
            if(statusRand >= 40) {
                testStatus = "Completed";
                TestRecentlyCompletedTickets[date] = parseInt(tickNum.toString() + custNum.toString());
                GenerateInvoice(year, month, day, date, testPriceFinal);
            }
            else if(statusRand >= 30) testStatus = "In Progress";
            else if(statusRand >= 23) testStatus = "Waiting on Customer";
            else testStatus = "Ready for Pickup";
        }
        else {
            testStatus = "Completed";
            TestRecentlyCompletedTickets[date] = parseInt(tickNum.toString() + custNum.toString());
            GenerateInvoice(year, month, day, date, testPriceFinal);
        }
    }
    if(testStatus != "Completed") TestOpenTickets[tickNum] = testStatus;
    
    var colorRand = getRandomNumber(0, 2);
    var testColor = "Black";
    if(colorRand == 1) testColor = "White";

    TestTickets[tickNum] = { Balance : testPriceFinal, 'Call When Complete' : false, Color : testColor, Customer : custNum, DateCreated : date.toString(),
        Device : testDevice.slice(4), ModelNmbr : "", Network: "", NextRepairNumber : 1, Notes : { [date] : { Content : "Ticket Created", Type : "Tech Note" } }, 
        Password : "", Repairs : TestRepairs, Status : testStatus, 'Tempered Glass' : false, Type : testType.slice(4) };

    if(TestCustomers && TestCustomers[custNum])
        TestCustomers[custNum]['Tickets'] = { [tickNum] : testDevice.slice(4) + " " + testType.slice(4)};
    tickNum++;
}

function GenerateInvoice(year, month, day, date, testPriceFinal) {
    TestRecentInvoices[date] = invNum;
    if(year in TestPaymentTotals && month in TestPaymentTotals[year] && day in TestPaymentTotals[year][month]) TestPaymentTotals[year][month][day] += testPriceFinal;
    else if(year in TestPaymentTotals && month in TestPaymentTotals[year]) TestPaymentTotals[year][month][day] = testPriceFinal;
    else if(year in TestPaymentTotals) TestPaymentTotals[year][month] = { [day] : testPriceFinal };
    else TestPaymentTotals = {[year] : {[month] : { [day] : testPriceFinal }}};

    var type = "Card";
    var randomType = getRandomNumber(0, 2);
    if(randomType == 1) type = "Cash";
    
    var invoiceObject = { Amount : testPriceFinal, Customer : custNum, FullDate : date, Refunded : false, Ticket : tickNum, Type : type };
    
    if(year in TestInvoices && month in TestInvoices[year] && day in TestInvoices[year][month]) TestInvoices[year][month][day][invNum] = invoiceObject;
    else if(year in TestInvoices && month in TestInvoices[year]) TestInvoices[year][month][day] = { [invNum] : invoiceObject };
    else if(year in TestInvoices) TestInvoices[year][month] = { [day] : { [invNum] : invoiceObject } };
    else TestInvoices = {[year] : {[month] : { [day] : { [invNum] : invoiceObject }}}};

    invNum++;
}









var firstNames = ["Aaran", "Aaren", "Aarez", "Aarman", "Aaron", "Aaron-James", "Aarron", "Aaryan", "Aaryn", "Aayan", "Aazaan", "Abaan", "Abbas", "Abdallah", "Abdalroof", "Abdihakim", "Abdirahman", "Abdisalam", "Abdul", "Abdul-Aziz", "Abdulbasir", "Abdulkadir", "Abdulkarem", "Abdulkhader", "Abdullah", "Abdul-Majeed", "Abdulmalik", "Abdul-Rehman", "Abdur", "Abdurraheem", "Abdur-Rahman", "Abdur-Rehmaan", "Abel", "Abhinav", "Abhisumant", "Abid", "Abir", "Abraham", "Abu", "Abubakar", "Ace", "Adain", "Adam", "Adam-James", "Addison", "Addisson", "Adegbola", "Adegbolahan", "Aden", "Adenn", "Adie", "Adil", "Aditya", "Adnan", "Adrian", "Adrien", "Aedan", "Aedin", "Aedyn", "Aeron", "Afonso", "Ahmad", "Ahmed", "Ahmed-Aziz", "Ahoua", "Ahtasham", "Aiadan", "Aidan", "Aiden", "Aiden-Jack", "Aiden-Vee", "Aidian", "Aidy", "Ailin", "Aiman", "Ainsley", "Ainslie", "Airen", "Airidas", "Airlie", "AJ", "Ajay", "A-Jay", "Ajayraj", "Akan", "Akram", "Al", "Ala", "Alan", "Alanas", "Alasdair", "Alastair", "Alber", "Albert", "Albie", "Aldred", "Alec", "Aled", "Aleem", "Aleksandar", "Aleksander", "Aleksandr", "Aleksandrs", "Alekzander", "Alessandro", "Alessio", "Alex", "Alexander", "Alexei", "Alexx", "Alexzander", "Alf", "Alfee", "Alfie", "Alfred", "Alfy", "Alhaji", "Al-Hassan", "Ali", "Aliekber", "Alieu", "Alihaider", "Alisdair", "Alishan", "Alistair", "Alistar", "Alister", "Aliyaan", "Allan", "Allan-Laiton", "Allen", "Allesandro", "Allister", "Ally", "Alphonse", "Altyiab", "Alum", "Alvern", "Alvin", "Alyas", "Amaan", "Aman", "Amani", "Ambanimoh", "Ameer", "Amgad", "Ami", "Amin", "Amir", "Ammaar", "Ammar", "Ammer", "Amolpreet", "Amos", "Amrinder", "Amrit", "Amro", "Anay", "Andrea", "Andreas", "Andrei", "Andrejs", "Andrew", "Andy", "Anees", "Anesu", "Angel", "Angelo", "Angus", "Anir", "Anis", "Anish", "Anmolpreet", "Annan", "Anndra", "Anselm", "Anthony", "Anthony-John", "Antoine", "Anton", "Antoni", "Antonio", "Antony", "Antonyo", "Anubhav", "Aodhan", "Aon", "Aonghus", "Apisai", "Arafat", "Aran", "Arandeep", "Arann", "Aray", "Arayan", "Archibald", "Archie", "Arda", "Ardal", "Ardeshir", "Areeb", "Areez", "Aref", "Arfin", "Argyle", "Argyll", "Ari", "Aria", "Arian", "Arihant", "Aristomenis", "Aristotelis", "Arjuna", "Arlo", "Armaan", "Arman", "Armen", "Arnab", "Arnav", "Arnold", "Aron", "Aronas", "Arran", "Arrham", "Arron", "Arryn", "Arsalan", "Artem", "Arthur", "Artur", "Arturo", "Arun", "Arunas", "Arved", "Arya", "Aryan", "Aryankhan", "Aryian", "Aryn", "Asa", "Asfhan", "Ash", "Ashlee-jay", "Ashley", "Ashton", "Ashton-Lloyd", "Ashtyn", "Ashwin", "Asif", "Asim", "Aslam", "Asrar", "Ata", "Atal", "Atapattu", "Ateeq", "Athol", "Athon", "Athos-Carlos", "Atli", "Atom", "Attila", "Aulay", "Aun", "Austen", "Austin", "Avani", "Averon", "Avi", "Avinash", "Avraham", "Awais", "Awwal", "Axel", "Ayaan", "Ayan", "Aydan", "Ayden", "Aydin", "Aydon", "Ayman", "Ayomide", "Ayren", "Ayrton", "Aytug", "Ayub", "Ayyub", "Azaan", "Azedine", "Azeem", "Azim", "Aziz", "Azlan", "Azzam", "Azzedine", "Babatunmise", "Babur", "Bader", "Badr", "Badsha", "Bailee", "Bailey", "Bailie", "Bailley", "Baillie", "Baley", "Balian", "Banan", "Barath", "Barkley", "Barney", "Baron", "Barrie", "Barry", "Bartlomiej", "Bartosz", "Basher", "Basile", "Baxter", "Baye", "Bayley", "Beau", "Beinn", "Bekim", "Believe", "Ben", "Bendeguz", "Benedict", "Benjamin", "Benjamyn", "Benji", "Benn", "Bennett", "Benny", "Benoit", "Bentley", "Berkay", "Bernard", "Bertie", "Bevin", "Bezalel", "Bhaaldeen", "Bharath", "Bilal", "Bill", "Billy", "Binod", "Bjorn", "Blaike", "Blaine", "Blair", "Blaire", "Blake", "Blazej", "Blazey", "Blessing", "Blue", "Blyth", "Bo", "Boab", "Bob", "Bobby", "Bobby-Lee", "Bodhan", "Boedyn", "Bogdan", "Bohbi", "Bony", "Bowen", "Bowie", "Boyd", "Bracken", "Brad", "Bradan", "Braden", "Bradley", "Bradlie", "Bradly", "Brady", "Bradyn", "Braeden", "Braiden", "Brajan", "Brandan", "Branden", "Brandon", "Brandonlee", "Brandon-Lee", "Brandyn", "Brannan", "Brayden", "Braydon", "Braydyn", "Breandan", "Brehme", "Brendan", "Brendon", "Brendyn", "Breogan", "Bret", "Brett", "Briaddon", "Brian", "Brodi", "Brodie", "Brody", "Brogan", "Broghan", "Brooke", "Brooklin", "Brooklyn", "Bruce", "Bruin", "Bruno", "Brunon", "Bryan", "Bryce", "Bryden", "Brydon", "Brydon-Craig", "Bryn", "Brynmor", "Bryson", "Buddy", "Bully", "Burak", "Burhan", "Butali", "Butchi", "Byron", "Cabhan", "Cadan", "Cade", "Caden", "Cadon", "Cadyn", "Caedan", "Caedyn", "Cael", "Caelan", "Caelen", "Caethan", "Cahl", "Cahlum", "Cai", "Caidan", "Caiden", "Caiden-Paul", "Caidyn", "Caie", "Cailaen", "Cailean", "Caileb-John", "Cailin", "Cain", "Caine", "Cairn", "Cal", "Calan", "Calder", "Cale", "Calean", "Caleb", "Calen", "Caley", "Calib", "Calin", "Callahan", "Callan", "Callan-Adam", "Calley", "Callie", "Callin", "Callum", "Callun", "Callyn", "Calum", "Calum-James", "Calvin", "Cambell", "Camerin", "Cameron", "Campbel", "Campbell", "Camron", "Caolain", "Caolan", "Carl", "Carlo", "Carlos", "Carrich", "Carrick", "Carson", "Carter", "Carwyn", "Casey", "Casper", "Cassy", "Cathal", "Cator", "Cavan", "Cayden", "Cayden-Robert", "Cayden-Tiamo", "Ceejay", "Ceilan", "Ceiran", "Ceirin", "Ceiron", "Cejay", "Celik", "Cephas", "Cesar", "Cesare", "Chad", "Chaitanya", "Chang-Ha", "Charles", "Charley", "Charlie", "Charly", "Chase", "Che", "Chester", "Chevy", "Chi", "Chibudom", "Chidera", "Chimsom", "Chin", "Chintu", "Chiqal", "Chiron", "Chris", "Chris-Daniel", "Chrismedi", "Christian", "Christie", "Christoph", "Christopher", "Christopher-Lee", "Christy", "Chu", "Chukwuemeka", "Cian", "Ciann", "Ciar", "Ciaran", "Ciarian", "Cieran", "Cillian", "Cillin", "Cinar", "CJ", "C-Jay", "Clark", "Clarke", "Clayton", "Clement", "Clifford", "Clyde", "Cobain", "Coban", "Coben", "Cobi", "Cobie", "Coby", "Codey", "Codi", "Codie", "Cody", "Cody-Lee", "Coel", "Cohan", "Cohen", "Colby", "Cole", "Colin", "Coll", "Colm", "Colt", "Colton", "Colum", "Colvin", "Comghan", "Conal", "Conall", "Conan", "Conar", "Conghaile", "Conlan", "Conley", "Conli", "Conlin", "Conlly", "Conlon", "Conlyn", "Connal", "Connall", "Connan", "Connar", "Connel", "Connell", "Conner", "Connolly", "Connor", "Connor-David", "Conor", "Conrad", "Cooper", "Copeland", "Coray", "Corben", "Corbin", "Corey", "Corey-James", "Corey-Jay", "Cori", "Corie", "Corin", "Cormac", "Cormack", "Cormak", "Corran", "Corrie", "Cory", "Cosmo", "Coupar", "Craig", "Craig-James", "Crawford", "Creag", "Crispin", "Cristian", "Crombie", "Cruiz", "Cruz", "Cuillin", "Cullen", "Cullin", "Curtis", "Cyrus", "Daanyaal", "Daegan", "Daegyu", "Dafydd", "Dagon", "Dailey", "Daimhin", "Daithi", "Dakota", "Daksh", "Dale", "Dalong", "Dalton", "Damian", "Damien", "Damon", "Dan", "Danar", "Dane", "Danial", "Daniel", "Daniele", "Daniel-James", "Daniels", "Daniil", "Danish", "Daniyal", "Danniel", "Danny", "Dante", "Danyal", "Danyil", "Danys", "Daood", "Dara", "Darach", "Daragh", "Darcy", "D'arcy", "Dareh", "Daren", "Darien", "Darius", "Darl", "Darn", "Darrach", "Darragh", "Darrel", "Darrell", "Darren", "Darrie", "Darrius", "Darroch", "Darryl", "Darryn", "Darwyn", "Daryl", "Daryn", "Daud", "Daumantas", "Davi", "David", "David-Jay", "David-Lee", "Davie", "Davis", "Davy", "Dawid", "Dawson", "Dawud", "Dayem", "Daymian", "Deacon", "Deagan", "Dean", "Deano", "Decklan", "Declain", "Declan", "Declyan", "Declyn", "Dedeniseoluwa", "Deecan", "Deegan", "Deelan", "Deklain-Jaimes", "Del", "Demetrius", "Denis", "Deniss", "Dennan", "Dennin", "Dennis", "Denny", "Dennys", "Denon", "Denton", "Denver", "Denzel", "Deon", "Derek", "Derick", "Derin", "Dermot", "Derren", "Derrie", "Derrin", "Derron", "Derry", "Derryn", "Deryn", "Deshawn", "Desmond", "Dev", "Devan", "Devin", "Devlin", "Devlyn", "Devon", "Devrin", "Devyn", "Dex", "Dexter", "Dhani", "Dharam", "Dhavid", "Dhyia", "Diarmaid", "Diarmid", "Diarmuid", "Didier", "Diego", "Diesel", "Diesil", "Digby", "Dilan", "Dilano", "Dillan", "Dillon", "Dilraj", "Dimitri", "Dinaras", "Dion", "Dissanayake", "Dmitri", "Doire", "Dolan", "Domanic", "Domenico", "Domhnall", "Dominic", "Dominick", "Dominik", "Donald", "Donnacha", "Donnie", "Dorian", "Dougal", "Douglas", "Dougray", "Drakeo", "Dre", "Dregan", "Drew", "Dugald", "Duncan", "Duriel", "Dustin", "Dylan", "Dylan-Jack", "Dylan-James", "Dylan-John", "Dylan-Patrick", "Dylin", "Dyllan", "Dyllan-James", "Dyllon", "Eadie", "Eagann", "Eamon", "Eamonn", "Eason", "Eassan", "Easton", "Ebow", "Ed", "Eddie", "Eden", "Ediomi", "Edison", "Eduardo", "Eduards", "Edward", "Edwin", "Edwyn", "Eesa", "Efan", "Efe", "Ege", "Ehsan", "Ehsen", "Eiddon", "Eidhan", "Eihli", "Eimantas", "Eisa", "Eli", "Elias", "Elijah", "Eliot", "Elisau", "Eljay", "Eljon", "Elliot", "Elliott", "Ellis", "Ellisandro", "Elshan", "Elvin", "Elyan", "Emanuel", "Emerson", "Emil", "Emile", "Emir", "Emlyn", "Emmanuel", "Emmet", "Eng", "Eniola", "Enis", "Ennis", "Enrico", "Enrique", "Enzo", "Eoghain", "Eoghan", "Eoin", "Eonan", "Erdehan", "Eren", "Erencem", "Eric", "Ericlee", "Erik", "Eriz", "Ernie-Jacks", "Eroni", "Eryk", "Eshan", "Essa", "Esteban", "Ethan", "Etienne", "Etinosa", "Euan", "Eugene", "Evan", "Evann", "Ewan", "Ewen", "Ewing", "Exodi", "Ezekiel", "Ezra", "Fabian", "Fahad", "Faheem", "Faisal", "Faizaan", "Famara", "Fares", "Farhaan", "Farhan", "Farren", "Farzad", "Fauzaan", "Favour", "Fawaz", "Fawkes", "Faysal", "Fearghus", "Feden", "Felix", "Fergal", "Fergie", "Fergus", "Ferre", "Fezaan", "Fiachra", "Fikret", "Filip", "Filippo", "Finan", "Findlay", "Findlay-James", "Findlie", "Finlay", "Finley", "Finn", "Finnan", "Finnean", "Finnen", "Finnlay", "Finnley", "Fintan", "Fionn", "Firaaz", "Fletcher", "Flint", "Florin", "Flyn", "Flynn", "Fodeba", "Folarinwa", "Forbes", "Forgan", "Forrest", "Fox", "Francesco", "Francis", "Francisco", "Franciszek", "Franco", "Frank", "Frankie", "Franklin", "Franko", "Fraser", "Frazer", "Fred", "Freddie", "Frederick", "Fruin", "Fyfe", "Fyn", "Fynlay", "Fynn", "Gabriel", "Gallagher", "Gareth", "Garren", "Garrett", "Garry", "Gary", "Gavin", "Gavin-Lee", "Gene", "Geoff", "Geoffrey", "Geomer", "Geordan", "Geordie", "George", "Georgia", "Georgy", "Gerard", "Ghyll", "Giacomo", "Gian", "Giancarlo", "Gianluca", "Gianmarco", "Gideon", "Gil", "Gio", "Girijan", "Girius", "Gjan", "Glascott", "Glen", "Glenn", "Gordon", "Grady", "Graeme", "Graham", "Grahame", "Grant", "Grayson", "Greg", "Gregor", "Gregory", "Greig", "Griffin", "Griffyn", "Grzegorz", "Guang", "Guerin", "Guillaume", "Gurardass", "Gurdeep", "Gursees", "Gurthar", "Gurveer", "Gurwinder", "Gus", "Gustav", "Guthrie", "Guy", "Gytis", "Habeeb", "Hadji", "Hadyn", "Hagun", "Haiden", "Haider", "Hamad", "Hamid", "Hamish", "Hamza", "Hamzah", "Han", "Hansen", "Hao", "Hareem", "Hari", "Harikrishna", "Haris", "Harish", "Harjeevan", "Harjyot", "Harlee", "Harleigh", "Harley", "Harman", "Harnek", "Harold", "Haroon", "Harper", "Harri", "Harrington", "Harris", "Harrison", "Harry", "Harvey", "Harvie", "Harvinder", "Hasan", "Haseeb", "Hashem", "Hashim", "Hassan", "Hassanali", "Hately", "Havila", "Hayden", "Haydn", "Haydon", "Haydyn", "Hcen", "Hector", "Heddle", "Heidar", "Heini", "Hendri", "Henri", "Henry", "Herbert", "Heyden", "Hiro", "Hirvaansh", "Hishaam", "Hogan", "Honey", "Hong", "Hope", "Hopkin", "Hosea", "Howard", "Howie", "Hristomir", "Hubert", "Hugh", "Hugo", "Humza", "Hunter", "Husnain", "Hussain", "Hussan", "Hussnain", "Hussnan", "Hyden", "I", "Iagan", "Iain", "Ian", "Ibraheem", "Ibrahim", "Idahosa", "Idrees", "Idris", "Iestyn", "Ieuan", "Igor", "Ihtisham", "Ijay", "Ikechukwu", "Ikemsinachukwu", "Ilyaas", "Ilyas", "Iman", "Immanuel", "Inan", "Indy", "Ines", "Innes", "Ioannis", "Ireayomide", "Ireoluwa", "Irvin", "Irvine", "Isa", "Isaa", "Isaac", "Isaiah", "Isak", "Isher", "Ishwar", "Isimeli", "Isira", "Ismaeel", "Ismail", "Israel", "Issiaka", "Ivan", "Ivar", "Izaak", "J", "Jaay", "Jac", "Jace", "Jack", "Jacki", "Jackie", "Jack-James", "Jackson", "Jacky", "Jacob", "Jacques", "Jad", "Jaden", "Jadon", "Jadyn", "Jae", "Jagat", "Jago", "Jaheim", "Jahid", "Jahy", "Jai", "Jaida", "Jaiden", "Jaidyn", "Jaii", "Jaime", "Jai-Rajaram", "Jaise", "Jak", "Jake", "Jakey", "Jakob", "Jaksyn", "Jakub", "Jamaal", "Jamal", "Jameel", "Jameil", "James", "James-Paul", "Jamey", "Jamie", "Jan", "Jaosha", "Jardine", "Jared", "Jarell", "Jarl", "Jarno", "Jarred", "Jarvi", "Jasey-Jay", "Jasim", "Jaskaran", "Jason", "Jasper", "Jaxon", "Jaxson", "Jay", "Jaydan", "Jayden", "Jayden-James", "Jayden-Lee", "Jayden-Paul", "Jayden-Thomas", "Jaydn", "Jaydon", "Jaydyn", "Jayhan", "Jay-Jay", "Jayke", "Jaymie", "Jayse", "Jayson", "Jaz", "Jazeb", "Jazib", "Jazz", "Jean", "Jean-Lewis", "Jean-Pierre", "Jebadiah", "Jed", "Jedd", "Jedidiah", "Jeemie", "Jeevan", "Jeffrey", "Jensen", "Jenson", "Jensyn", "Jeremy", "Jerome", "Jeronimo", "Jerrick", "Jerry", "Jesse", "Jesuseun", "Jeswin", "Jevan", "Jeyun", "Jez", "Jia", "Jian", "Jiao", "Jimmy", "Jincheng", "JJ", "Joaquin", "Joash", "Jock", "Jody", "Joe", "Joeddy", "Joel", "Joey", "Joey-Jack", "Johann", "Johannes", "Johansson", "John", "Johnathan", "Johndean", "Johnjay", "John-Michael", "Johnnie", "Johnny", "Johnpaul", "John-Paul", "John-Scott", "Johnson", "Jole", "Jomuel", "Jon", "Jonah", "Jonatan", "Jonathan", "Jonathon", "Jonny", "Jonothan", "Jon-Paul", "Jonson", "Joojo", "Jordan", "Jordi", "Jordon", "Jordy", "Jordyn", "Jorge", "Joris", "Jorryn", "Josan", "Josef", "Joseph", "Josese", "Josh", "Joshiah", "Joshua", "Josiah", "Joss", "Jostelle", "Joynul", "Juan", "Jubin", "Judah", "Jude", "Jules", "Julian", "Julien", "Jun", "Junior", "Jura", "Justan", "Justin", "Justinas", "Kaan", "Kabeer", "Kabir", "Kacey", "Kacper", "Kade", "Kaden", "Kadin", "Kadyn", "Kaeden", "Kael", "Kaelan", "Kaelin", "Kaelum", "Kai", "Kaid", "Kaidan", "Kaiden", "Kaidinn", "Kaidyn", "Kaileb", "Kailin", "Kain", "Kaine", "Kainin", "Kainui", "Kairn", "Kaison", "Kaiwen", "Kajally", "Kajetan", "Kalani", "Kale", "Kaleb", "Kaleem", "Kal-el", "Kalen", "Kalin", "Kallan", "Kallin", "Kalum", "Kalvin", "Kalvyn", "Kameron", "Kames", "Kamil", "Kamran", "Kamron", "Kane", "Karam", "Karamvir", "Karandeep", "Kareem", "Karim", "Karimas", "Karl", "Karol", "Karson", "Karsyn", "Karthikeya", "Kasey", "Kash", "Kashif", "Kasim", "Kasper", "Kasra", "Kavin", "Kayam", "Kaydan", "Kayden", "Kaydin", "Kaydn", "Kaydyn", "Kaydyne", "Kayleb", "Kaylem", "Kaylum", "Kayne", "Kaywan", "Kealan", "Kealon", "Kean", "Keane", "Kearney", "Keatin", "Keaton", "Keavan", "Keayn", "Kedrick", "Keegan", "Keelan", "Keelin", "Keeman", "Keenan", "Keenan-Lee", "Keeton", "Kehinde", "Keigan", "Keilan", "Keir", "Keiran", "Keiren", "Keiron", "Keiryn", "Keison", "Keith", "Keivlin", "Kelam", "Kelan", "Kellan", "Kellen", "Kelso", "Kelum", "Kelvan", "Kelvin", "Ken", "Kenan", "Kendall", "Kendyn", "Kenlin", "Kenneth", "Kensey", "Kenton", "Kenyon", "Kenzeigh", "Kenzi", "Kenzie", "Kenzo", "Kenzy", "Keo", "Ker", "Kern", "Kerr", "Kevan", "Kevin", "Kevyn", "Kez", "Khai", "Khalan", "Khaleel", "Khaya", "Khevien", "Khizar", "Khizer", "Kia", "Kian", "Kian-James", "Kiaran", "Kiarash", "Kie", "Kiefer", "Kiegan", "Kienan", "Kier", "Kieran", "Kieran-Scott", "Kieren", "Kierin", "Kiern", "Kieron", "Kieryn", "Kile", "Killian", "Kimi", "Kingston", "Kinneil", "Kinnon", "Kinsey", "Kiran", "Kirk", "Kirwin", "Kit", "Kiya", "Kiyonari", "Kjae", "Klein", "Klevis", "Kobe", "Kobi", "Koby", "Koddi", "Koden", "Kodi", "Kodie", "Kody", "Kofi", "Kogan", "Kohen", "Kole", "Konan", "Konar", "Konnor", "Konrad", "Koray", "Korben", "Korbyn", "Korey", "Kori", "Korrin", "Kory", "Koushik", "Kris", "Krish", "Krishan", "Kriss", "Kristian", "Kristin", "Kristofer", "Kristoffer", "Kristopher", "Kruz", "Krzysiek", "Krzysztof", "Ksawery", "Ksawier", "Kuba", "Kurt", "Kurtis", "Kurtis-Jae", "Kyaan", "Kyan", "Kyde", "Kyden", "Kye", "Kyel", "Kyhran", "Kyie", "Kylan", "Kylar", "Kyle", "Kyle-Derek", "Kylian", "Kym", "Kynan", "Kyral", "Kyran", "Kyren", "Kyrillos", "Kyro", "Kyron", "Kyrran", "Lachlainn", "Lachlan", "Lachlann", "Lael", "Lagan", "Laird", "Laison", "Lakshya", "Lance", "Lancelot", "Landon", "Lang", "Lasse", "Latif", "Lauchlan", "Lauchlin", "Laughlan", "Lauren", "Laurence", "Laurie", "Lawlyn", "Lawrence", "Lawrie", "Lawson", "Layne", "Layton", "Lee", "Leigh", "Leigham", "Leighton", "Leilan", "Leiten", "Leithen", "Leland", "Lenin", "Lennan", "Lennen", "Lennex", "Lennon", "Lennox", "Lenny", "Leno", "Lenon", "Lenyn", "Leo", "Leon", "Leonard", "Leonardas", "Leonardo", "Lepeng", "Leroy", "Leven", "Levi", "Levon", "Levy", "Lewie", "Lewin", "Lewis", "Lex", "Leydon", "Leyland", "Leylann", "Leyton", "Liall", "Liam", "Liam-Stephen", "Limo", "Lincoln", "Lincoln-John", "Lincon", "Linden", "Linton", "Lionel", "Lisandro", "Litrell", "Liyonela-Elam", "LLeyton", "Lliam", "Lloyd", "Lloyde", "Loche", "Lochlan", "Lochlann", "Lochlan-Oliver", "Lock", "Lockey", "Logan", "Logann", "Logan-Rhys", "Loghan", "Lokesh", "Loki", "Lomond", "Lorcan", "Lorenz", "Lorenzo", "Lorne", "Loudon", "Loui", "Louie", "Louis", "Loukas", "Lovell", "Luc", "Luca", "Lucais", "Lucas", "Lucca", "Lucian", "Luciano", "Lucien", "Lucus", "Luic", "Luis", "Luk", "Luka", "Lukas", "Lukasz", "Luke", "Lukmaan", "Luqman", "Lyall", "Lyle", "Lyndsay", "Lysander", "Maanav", "Maaz", "Mac", "Macallum", "Macaulay", "Macauley", "Macaully", "Machlan", "Maciej", "Mack", "Mackenzie", "Mackenzy", "Mackie", "Macsen", "Macy", "Madaki", "Maddison", "Maddox", "Madison", "Madison-Jake", "Madox", "Mael", "Magnus", "Mahan", "Mahdi", "Mahmoud", "Maias", "Maison", "Maisum", "Maitlind", "Majid", "Makensie", "Makenzie", "Makin", "Maksim", "Maksymilian", "Malachai", "Malachi", "Malachy", "Malakai", "Malakhy", "Malcolm", "Malik", "Malikye", "Malo", "Ma'moon", "Manas", "Maneet", "Manmohan", "Manolo", "Manson", "Mantej", "Manuel", "Manus", "Marc", "Marc-Anthony", "Marcel", "Marcello", "Marcin", "Marco", "Marcos", "Marcous", "Marcquis", "Marcus", "Mario", "Marios", "Marius", "Mark", "Marko", "Markus", "Marley", "Marlin", "Marlon", "Maros", "Marshall", "Martin", "Marty", "Martyn", "Marvellous", "Marvin", "Marwan", "Maryk", "Marzuq", "Mashhood", "Mason", "Mason-Jay", "Masood", "Masson", "Matas", "Matej", "Mateusz", "Mathew", "Mathias", "Mathu", "Mathuyan", "Mati", "Matt", "Matteo", "Matthew", "Matthew-William", "Matthias", "Max", "Maxim", "Maximilian", "Maximillian", "Maximus", "Maxwell", "Maxx", "Mayeul", "Mayson", "Mazin", "Mcbride", "McCaulley", "McKade", "McKauley", "McKay", "McKenzie", "McLay", "Meftah", "Mehmet", "Mehraz", "Meko", "Melville", "Meshach", "Meyzhward", "Micah", "Michael", "Michael-Alexander", "Michael-James", "Michal", "Michat", "Micheal", "Michee", "Mickey", "Miguel", "Mika", "Mikael", "Mikee", "Mikey", "Mikhail", "Mikolaj", "Miles", "Millar", "Miller", "Milo", "Milos", "Milosz", "Mir", "Mirza", "Mitch", "Mitchel", "Mitchell", "Moad", "Moayd", "Mobeen", "Modoulamin", "Modu", "Mohamad", "Mohamed", "Mohammad", "Mohammad-Bilal", "Mohammed", "Mohanad", "Mohd", "Momin", "Momooreoluwa", "Montague", "Montgomery", "Monty", "Moore", "Moosa", "Moray", "Morgan", "Morgyn", "Morris", "Morton", "Moshy", "Motade", "Moyes", "Msughter", "Mueez", "Muhamadjavad", "Muhammad", "Muhammed", "Muhsin", "Muir", "Munachi", "Muneeb", "Mungo", "Munir", "Munmair", "Munro", "Murdo", "Murray", "Murrough", "Murry", "Musa", "Musse", "Mustafa", "Mustapha", "Muzammil", "Muzzammil", "Mykie", "Myles", "Mylo", "Nabeel", "Nadeem", "Nader", "Nagib", "Naif", "Nairn", "Narvic", "Nash", "Nasser", "Nassir", "Natan", "Nate", "Nathan", "Nathanael", "Nathanial", "Nathaniel", "Nathan-Rae", "Nawfal", "Nayan", "Neco", "Neil", "Nelson", "Neo", "Neshawn", "Nevan", "Nevin", "Ngonidzashe", "Nial", "Niall", "Nicholas", "Nick", "Nickhill", "Nicki", "Nickson", "Nicky", "Nico", "Nicodemus", "Nicol", "Nicolae", "Nicolas", "Nidhish", "Nihaal", "Nihal", "Nikash", "Nikhil", "Niki", "Nikita", "Nikodem", "Nikolai", "Nikos", "Nilav", "Niraj", "Niro", "Niven", "Noah", "Noel", "Nolan", "Noor", "Norman", "Norrie", "Nuada", "Nyah", "Oakley", "Oban", "Obieluem", "Obosa", "Odhran", "Odin", "Odynn", "Ogheneochuko", "Ogheneruno", "Ohran", "Oilibhear", "Oisin", "Ojima-Ojo", "Okeoghene", "Olaf", "Ola-Oluwa", "Olaoluwapolorimi", "Ole", "Olie", "Oliver", "Olivier", "Oliwier", "Ollie", "Olurotimi", "Oluwadamilare", "Oluwadamiloju", "Oluwafemi", "Oluwafikunayomi", "Oluwalayomi", "Oluwatobiloba", "Oluwatoni", "Omar", "Omri", "Oran", "Orin", "Orlando", "Orley", "Orran", "Orrick", "Orrin", "Orson", "Oryn", "Oscar", "Osesenagha", "Oskar", "Ossian", "Oswald", "Otto", "Owain", "Owais", "Owen", "Owyn", "Oz", "Ozzy", "Pablo", "Pacey", "Padraig", "Paolo", "Pardeepraj", "Parkash", "Parker", "Pascoe", "Pasquale", "Patrick", "Patrick-John", "Patrikas", "Patryk", "Paul", "Pavit", "Pawel", "Pawlo", "Pearce", "Pearse", "Pearsen", "Pedram", "Pedro", "Peirce", "Peiyan", "Pele", "Peni", "Peregrine", "Peter", "Phani", "Philip", "Philippos", "Phinehas", "Phoenix", "Phoevos", "Pierce", "Pierre-Antoine", "Pieter", "Pietro", "Piotr", "Porter", "Prabhjoit", "Prabodhan", "Praise", "Pranav", "Pravin", "Precious", "Prentice", "Presley", "Preston", "Preston-Jay", "Prinay", "Prince", "Prithvi", "Promise", "Puneetpaul", "Pushkar", "Qasim", "Qirui", "Quinlan", "Quinn", "Radmiras", "Raees", "Raegan", "Rafael", "Rafal", "Rafferty", "Rafi", "Raheem", "Rahil", "Rahim", "Rahman", "Raith", "Raithin", "Raja", "Rajab-Ali", "Rajan", "Ralfs", "Ralph", "Ramanas", "Ramit", "Ramone", "Ramsay", "Ramsey", "Rana", "Ranolph", "Raphael", "Rasmus", "Rasul", "Raul", "Raunaq", "Ravin", "Ray", "Rayaan", "Rayan", "Rayane", "Rayden", "Rayhan", "Raymond", "Rayne", "Rayyan", "Raza", "Reace", "Reagan", "Reean", "Reece", "Reed", "Reegan", "Rees", "Reese", "Reeve", "Regan", "Regean", "Reggie", "Rehaan", "Rehan", "Reice", "Reid", "Reigan", "Reilly", "Reily", "Reis", "Reiss", "Remigiusz", "Remo", "Remy", "Ren", "Renars", "Reng", "Rennie", "Reno", "Reo", "Reuben", "Rexford", "Reynold", "Rhein", "Rheo", "Rhett", "Rheyden", "Rhian", "Rhoan", "Rholmark", "Rhoridh", "Rhuairidh", "Rhuan", "Rhuaridh", "Rhudi", "Rhy", "Rhyan", "Rhyley", "Rhyon", "Rhys", "Rhys-Bernard", "Rhyse", "Riach", "Rian", "Ricards", "Riccardo", "Ricco", "Rice", "Richard", "Richey", "Richie", "Ricky", "Rico", "Ridley", "Ridwan", "Rihab", "Rihan", "Rihards", "Rihonn", "Rikki", "Riley", "Rio", "Rioden", "Rishi", "Ritchie", "Rivan", "Riyadh", "Riyaj", "Roan", "Roark", "Roary", "Rob", "Robbi", "Robbie", "Robbie-lee", "Robby", "Robert", "Robert-Gordon", "Robertjohn", "Robi", "Robin", "Rocco", "Roddy", "Roderick", "Rodrigo", "Roen", "Rogan", "Roger", "Rohaan", "Rohan", "Rohin", "Rohit", "Rokas", "Roman", "Ronald", "Ronan", "Ronan-Benedict", "Ronin", "Ronnie", "Rooke", "Roray", "Rori", "Rorie", "Rory", "Roshan", "Ross", "Ross-Andrew", "Rossi", "Rowan", "Rowen", "Roy", "Ruadhan", "Ruaidhri", "Ruairi", "Ruairidh", "Ruan", "Ruaraidh", "Ruari", "Ruaridh", "Ruben", "Rubhan", "Rubin", "Rubyn", "Rudi", "Rudy", "Rufus", "Rui", "Ruo", "Rupert", "Ruslan", "Russel", "Russell", "Ryaan", "Ryan", "Ryan-Lee", "Ryden", "Ryder", "Ryese", "Ryhs", "Rylan", "Rylay", "Rylee", "Ryleigh", "Ryley", "Rylie", "Ryo", "Ryszard", "Saad", "Sabeen", "Sachkirat", "Saffi", "Saghun", "Sahaib", "Sahbian", "Sahil", "Saif", "Saifaddine", "Saim", "Sajid", "Sajjad", "Salahudin", "Salman", "Salter", "Salvador", "Sam", "Saman", "Samar", "Samarjit", "Samatar", "Sambrid", "Sameer", "Sami", "Samir", "Sami-Ullah", "Samual", "Samuel", "Samuela", "Samy", "Sanaullah", "Sandro", "Sandy", "Sanfur", "Sanjay", "Santiago", "Santino", "Satveer", "Saul", "Saunders", "Savin", "Sayad", "Sayeed", "Sayf", "Scot", "Scott", "Scott-Alexander", "Seaan", "Seamas", "Seamus", "Sean", "Seane", "Sean-James", "Sean-Paul", "Sean-Ray", "Seb", "Sebastian", "Sebastien", "Selasi", "Seonaidh", "Sephiroth", "Sergei", "Sergio", "Seth", "Sethu", "Seumas", "Shaarvin", "Shadow", "Shae", "Shahmir", "Shai", "Shane", "Shannon", "Sharland", "Sharoz", "Shaughn", "Shaun", "Shaunpaul", "Shaun-Paul", "Shaun-Thomas", "Shaurya", "Shaw", "Shawn", "Shawnpaul", "Shay", "Shayaan", "Shayan", "Shaye", "Shayne", "Shazil", "Shea", "Sheafan", "Sheigh", "Shenuk", "Sher", "Shergo", "Sheriff", "Sherwyn", "Shiloh", "Shiraz", "Shreeram", "Shreyas", "Shyam", "Siddhant", "Siddharth", "Sidharth", "Sidney", "Siergiej", "Silas", "Simon", "Sinai", "Skye", "Sofian", "Sohaib", "Sohail", "Soham", "Sohan", "Sol", "Solomon", "Sonneey", "Sonni", "Sonny", "Sorley", "Soul", "Spencer", "Spondon", "Stanislaw", "Stanley", "Stefan", "Stefano", "Stefin", "Stephen", "Stephenjunior", "Steve", "Steven", "Steven-lee", "Stevie", "Stewart", "Stewarty", "Strachan", "Struan", "Stuart", "Su", "Subhaan", "Sudais", "Suheyb", "Suilven", "Sukhi", "Sukhpal", "Sukhvir", "Sulayman", "Sullivan", "Sultan", "Sung", "Sunny", "Suraj", "Surien", "Sweyn", "Syed", "Sylvain", "Symon", "Szymon", "Tadd", "Taddy", "Tadhg", "Taegan", "Taegen", "Tai", "Tait", "Taiwo", "Talha", "Taliesin", "Talon", "Talorcan", "Tamar", "Tamiem", "Tammam", "Tanay", "Tane", "Tanner", "Tanvir", "Tanzeel", "Taonga", "Tarik", "Tariq-Jay", "Tate", "Taylan", "Taylar", "Tayler", "Taylor", "Taylor-Jay", "Taylor-Lee", "Tayo", "Tayyab", "Tayye", "Tayyib", "Teagan", "Tee", "Teejay", "Tee-jay", "Tegan", "Teighen", "Teiyib", "Te-Jay", "Temba", "Teo", "Teodor", "Teos", "Terry", "Teydren", "Theo", "Theodore", "Thiago", "Thierry", "Thom", "Thomas", "Thomas-Jay", "Thomson", "Thorben", "Thorfinn", "Thrinei", "Thumbiko", "Tiago", "Tian", "Tiarnan", "Tibet", "Tieran", "Tiernan", "Timothy", "Timucin", "Tiree", "Tisloh", "Titi", "Titus", "Tiylar", "TJ", "Tjay", "T-Jay", "Tobey", "Tobi", "Tobias", "Tobie", "Toby", "Todd", "Tokinaga", "Toluwalase", "Tom", "Tomas", "Tomasz", "Tommi-Lee", "Tommy", "Tomson", "Tony", "Torin", "Torquil", "Torran", "Torrin", "Torsten", "Trafford", "Trai", "Travis", "Tre", "Trent", "Trey", "Tristain", "Tristan", "Troy", "Tubagus", "Turki", "Turner", "Ty", "Ty-Alexander", "Tye", "Tyelor", "Tylar", "Tyler", "Tyler-James", "Tyler-Jay", "Tyllor", "Tylor", "Tymom", "Tymon", "Tymoteusz", "Tyra", "Tyree", "Tyrnan", "Tyrone", "Tyson", "Ubaid", "Ubayd", "Uchenna", "Uilleam", "Umair", "Umar", "Umer", "Umut", "Urban", "Uri", "Usman", "Uzair", "Uzayr", "Valen", "Valentin", "Valentino", "Valery", "Valo", "Vasyl", "Vedantsinh", "Veeran", "Victor", "Victory", "Vinay", "Vince", "Vincent", "Vincenzo", "Vinh", "Vinnie", "Vithujan", "Vladimir", "Vladislav", "Vrishin", "Vuyolwethu", "Wabuya", "Wai", "Walid", "Wallace", "Walter", "Waqaas", "Warkhas", "Warren", "Warrick", "Wasif", "Wayde", "Wayne", "Wei", "Wen", "Wesley", "Wesley-Scott", "Wiktor", "Wilkie", "Will", "William", "William-John", "Willum", "Wilson", "Windsor", "Wojciech", "Woyenbrakemi", "Wyatt", "Wylie", "Wynn", "Xabier", "Xander", "Xavier", "Xiao", "Xida", "Xin", "Xue", "Yadgor", "Yago", "Yahya", "Yakup", "Yang", "Yanick", "Yann", "Yannick", "Yaseen", "Yasin", "Yasir", "Yassin", "Yoji", "Yong", "Yoolgeun", "Yorgos", "Youcef", "Yousif", "Youssef", "Yu", "Yuanyu", "Yuri", "Yusef", "Yusuf", "Yves", "Zaaine", "Zaak", "Zac", "Zach", "Zachariah", "Zacharias", "Zacharie", "Zacharius", "Zachariya", "Zachary", "Zachary-Marc", "Zachery", "Zack", "Zackary", "Zaid", "Zain", "Zaine", "Zaineddine", "Zainedin", "Zak", "Zakaria", "Zakariya", "Zakary", "Zaki", "Zakir", "Zakk", "Zamaar", "Zander", "Zane", "Zarran", "Zayd", "Zayn", "Zayne", "Ze", "Zechariah", "Zeek", "Zeeshan", "Zeid", "Zein", "Zen", "Zendel", "Zenith", "Zennon", "Zeph", "Zerah", "Zhen", "Zhi", "Zhong", "Zhuo", "Zi", "Zidane", "Zijie", "Zinedine", "Zion", "Zishan", "Ziya", "Ziyaan", "Zohaib", "Zohair", "Zoubaeir", "Zubair", "Zubayr", "Zuriel"];

var lastNames = ['Abbott', 'Acevedo','Acosta','Adams','Adkins','Aguilar','Aguirre','Albert','Alexander','Alford','Allen','Allison','Alston','Alvarado','Alvarez','Anderson','Andrews','Anthony','Armstrong','Arnold','Ashley','Atkins','Atkinson','Austin','Avery','Avila','Ayala','Ayers','Bailey','Baird','Baker','Baldwin','Ball','Ballard','Banks','Barber','Barker','Barlow','Barnes','Barnett','Barr','Barrera','Barrett','Barron','Barry','Bartlett','Barton','Bass','Bates','Battle','Bauer','Baxter','Beach','Bean','Beard','Beasley','Beck','Becker','Bell','Bender','Benjamin','Bennett','Benson','Bentley','Benton','Berg','Berger','Bernard','Berry','Best','Bird','Bishop','Black','Blackburn','Blackwell','Blair','Blake','Blanchard','Blankenship','Blevins','Bolton','Bond','Bonner','Booker','Boone','Booth','Bowen','Bowers','Bowman','Boyd','Boyer','Boyle','Bradford','Bradley','Bradshaw','Brady','Branch','Bray','Brennan','Brewer','Bridges','Briggs','Bright','Britt','Brock','Brooks','Brown','Browning','Bruce','Bryan','Bryant','Buchanan','Buck','Buckley','Buckner','Bullock','Burch','Burgess','Burke','Burks','Burnett','Burns','Burris','Burt','Burton','Bush','Butler','Byers','Byrd','Cabrera','Cain','Calderon','Caldwell','Calhoun','Callahan','Camacho','Cameron','Campbell','Campos','Cannon','Cantrell','Cantu','Cardenas','Carey','Carlson','Carney','Carpenter','Carr','Carrillo','Carroll','Carson','Carter','Carver','Case','Casey','Cash','Castaneda','Castillo','Castro','Cervantes','Chambers','Chan','Chandler','Chaney','Chang','Chapman','Charles','Chase','Chavez','Chen','Cherry','Christensen','Christian','Church','Clark','Clarke','Clay','Clayton','Clements','Clemons','Cleveland','Cline','Cobb','Cochran','Coffey','Cohen','Cole','Coleman','Collier','Collins','Colon','Combs','Compton','Conley','Conner','Conrad','Contreras','Conway','Cook','Cooke','Cooley','Cooper','Copeland','Cortez','Cote','Cotton','Cox','Craft','Craig','Crane','Crawford','Crosby','Cross','Cruz','Cummings','Cunningham','Curry','Curtis','Dale','Dalton','Daniel','Daniels','Daugherty','Davenport','David','Davidson','Davis','Dawson','Day','Dean','Decker','Dejesus','Delacruz','Delaney','Deleon','Delgado','Dennis','Diaz','Dickerson','Dickson','Dillard','Dillon','Dixon','Dodson','Dominguez','Donaldson','Donovan','Dorsey','Dotson','Douglas','Downs','Doyle','Drake','Dudley','Duffy','Duke','Duncan','Dunlap','Dunn','Duran','Durham','Dyer','Eaton','Edwards','Elliott','Ellis','Ellison','Emerson','England','English','Erickson','Espinoza','Estes','Estrada','Evans','Everett','Ewing','Farley','Farmer','Farrell','Faulkner','Ferguson','Fernandez','Ferrell','Fields','Figueroa','Finch','Finley','Fischer','Fisher','Fitzgerald','Fitzpatrick','Fleming','Fletcher','Flores','Flowers','Floyd','Flynn','Foley','Forbes','Ford','Foreman','Foster','Fowler','Fox','Francis','Franco','Frank','Franklin','Franks','Frazier','Frederick','Freeman','French','Frost','Fry','Frye','Fuentes','Fuller','Fulton','Gaines','Gallagher','Gallegos','Galloway','Gamble','Garcia','Gardner','Garner','Garrett','Garrison','Garza','Gates','Gay','Gentry','George','Gibbs','Gibson','Gilbert','Giles','Gill','Gillespie','Gilliam','Gilmore','Glass','Glenn','Glover','Goff','Golden','Gomez','Gonzales','Gonzalez','Good','Goodman','Goodwin','Gordon','Gould','Graham','Grant','Graves','Gray','Green','Greene','Greer','Gregory','Griffin','Griffith','Grimes','Gross','Guerra','Guerrero','Guthrie','Gutierrez','Guy','Guzman','Hahn','Hale','Haley','Hall','Hamilton','Hammond','Hampton','Hancock','Haney','Hansen','Hanson','Hardin','Harding','Hardy','Harmon','Harper','Harrell','Harrington','Harris','Harrison','Hart','Hartman','Harvey','Hatfield','Hawkins','Hayden','Hayes','Haynes','Hays','Head','Heath','Hebert','Henderson','Hendricks','Hendrix','Henry','Hensley','Henson','Herman','Hernandez','Herrera','Herring','Hess','Hester','Hewitt','Hickman','Hicks','Higgins','Hill','Hines','Hinton','Hobbs','Hodge','Hodges','Hoffman','Hogan','Holcomb','Holden','Holder','Holland','Holloway','Holman','Holmes','Holt','Hood','Hooper','Hoover','Hopkins','Hopper','Horn','Horne','Horton','House','Houston','Howard','Howe','Howell','Hubbard','Huber','Hudson','Huff','Huffman','Hughes','Hull','Humphrey','Hunt','Hunter','Hurley','Hurst','Hutchinson','Hyde','Ingram','Irwin','Jackson','Jacobs','Jacobson','James','Jarvis','Jefferson','Jenkins','Jennings','Jensen','Jimenez','Johns','Johnson','Johnston','Jones','Jordan','Joseph','Joyce','Joyner','Juarez','Justice','Kane','Kaufman','Keith','Keller','Kelley','Kelly','Kemp','Kennedy','Kent','Kerr','Key','Kidd','Kim','King','Kinney','Kirby','Kirk','Kirkland','Klein','Kline','Knapp','Knight','Knowles','Knox','Koch','Kramer','Lamb','Lambert','Lancaster','Landry','Lane','Lang','Langley','Lara','Larsen','Larson','Lawrence','Lawson','Le','Leach','Leblanc','Lee','Leon','Leonard','Lester','Levine','Levy','Lewis','Lindsay','Lindsey','Little','Livingston','Lloyd','Logan','Long','Lopez','Lott','Love','Lowe','Lowery','Lucas','Luna','Lynch','Lynn','Lyons','Macdonald','Macias','Mack','Madden','Maddox','Maldonado','Malone','Mann','Manning','Marks','Marquez','Marsh','Marshall','Martin','Martinez','Mason','Massey','Mathews','Mathis','Matthews','Maxwell','May','Mayer','Maynard','Mayo','Mays','Mcbride','Mccall','Mccarthy','Mccarty','Mcclain','Mcclure','Mcconnell','Mccormick','Mccoy','Mccray','Mccullough','Mcdaniel','Mcdonald','Mcdowell','Mcfadden','Mcfarland','Mcgee','Mcgowan','Mcguire','Mcintosh','Mcintyre','Mckay','Mckee','Mckenzie','Mckinney','Mcknight','Mclaughlin','Mclean','Mcleod','Mcmahon','Mcmillan','Mcneil','Mcpherson','Meadows','Medina','Mejia','Melendez','Melton','Mendez','Mendoza','Mercado','Mercer','Merrill','Merritt','Meyer','Meyers','Michael','Middleton','Miles','Miller','Mills','Miranda','Mitchell','Molina','Monroe','Montgomery','Montoya','Moody','Moon','Mooney','Moore','Morales','Moran','Moreno','Morgan','Morin','Morris','Morrison','Morrow','Morse','Morton','Moses','Mosley','Moss','Mueller','Mullen','Mullins','Munoz','Murphy','Murray','Myers','Nash','Navarro','Neal','Nelson','Newman','Newton','Nguyen','Nichols','Nicholson','Nielsen','Nieves','Nixon','Noble','Noel','Nolan','Norman','Norris','Norton','Nunez','Obrien','Ochoa','Oconnor','Odom','Odonnell','Oliver','Olsen','Olson','Oneal','Oneil','Oneill','Orr','Ortega','Ortiz','Osborn','Osborne','Owen','Owens','Pace','Pacheco','Padilla','Page','Palmer','Park','Parker','Parks','Parrish','Parsons','Pate','Patel','Patrick','Patterson','Patton','Paul','Payne','Pearson','Peck','Pena','Pennington','Perez','Perkins','Perry','Peters','Petersen','Peterson','Petty','Phelps','Phillips','Pickett','Pierce','Pittman','Pitts','Pollard','Poole','Pope','Porter','Potter','Potts','Powell','Powers','Pratt','Preston','Price','Prince','Pruitt','Puckett','Pugh','Quinn','Ramirez','Ramos','Ramsey','Randall','Randolph','Rasmussen','Ratliff','Ray','Raymond','Reed','Reese','Reeves','Reid','Reilly','Reyes','Reynolds','Rhodes','Rice','Rich','Richard','Richards','Richardson','Richmond','Riddle','Riggs','Riley','Rios','Rivas','Rivera','Rivers','Roach','Robbins','Roberson','Roberts','Robertson','Robinson','Robles','Rocha','Rodgers','Rodriguez','Rodriquez','Rogers','Rojas','Rollins','Roman','Romero','Rosa','Rosales','Rosario','Rose','Ross','Roth','Rowe','Rowland','Roy','Ruiz','Rush','Russell','Russo','Rutledge','Ryan','Salas','Salazar','Salinas','Sampson','Sanchez','Sanders','Sandoval','Sanford','Santana','Santiago','Santos','Sargent','Saunders','Savage','Sawyer','Schmidt','Schneider','Schroeder','Schultz','Schwartz','Scott','Sears','Sellers','Serrano','Sexton','Shaffer','Shannon','Sharp','Sharpe','Shaw','Shelton','Shepard','Shepherd','Sheppard','Sherman','Shields','Short','Silva','Simmons','Simon','Simpson','Sims','Singleton','Skinner','Slater','Sloan','Small','Smith','Snider','Snow','Snyder','Solis','Solomon','Sosa','Soto','Sparks','Spears','Spence','Spencer','Stafford','Stanley','Stanton','Stark','Steele','Stein','Stephens','Stephenson','Stevens','Stevenson','Stewart','Stokes','Stone','Stout','Strickland','Strong','Stuart','Suarez','Sullivan','Summers','Sutton','Swanson','Sweeney','Sweet','Sykes','Talley','Tanner','Tate','Taylor','Terrell','Terry','Thomas','Thompson','Thornton','Tillman','Todd','Torres','Townsend','Tran','Travis','Trevino','Trujillo','Tucker','Turner','Tyler','Tyson','Underwood','Valdez','Valencia','Valentine','Valenzuela','Vance','Vang','Vargas','Vasquez','Vaughan','Vaughn','Vazquez','Vega','Velasquez','Velazquez','Velez','Villarreal','Vincent','Vinson','Wade','Wagner','Walker','Wall','Wallace','Waller','Walls','Walsh','Walter','Walters','Walton','Ward','Ware','Warner','Warren','Washington','Waters','Watkins','Watson','Watts','Weaver','Webb','Weber','Webster','Weeks','Weiss','Welch','Wells','West','Wheeler','Whitaker','White','Whitehead','Whitfield','Whitley','Whitney','Wiggins','Wilcox','Wilder','Wiley','Wilkerson','Wilkins','Wilkinson','William','Williams','Williamson','Willis','Wilson','Winters','Wise','Witt','Wolf','Wolfe','Wong','Wood','Woodard','Woods','Woodward','Wooten','Workman','Wright','Wyatt','Wynn','Yang','Yates','York','Young','Zamora','Zimmerman'];
var TestPrices = {
    "1000Apple": {
      "1000iPhone 13 Pro Max": {
        "1001LCD": {
          "Price": 419,
          "Tax": true
        },
        "1002Battery": {
          "Price": 129,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 149,
          "Tax": true
        }
      },
      "1001iPhone 13 Pro": {
        "1001LCD": {
          "Price": 349,
          "Tax": true
        },
        "1002Battery": {
          "Price": 119,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 139,
          "Tax": true
        }
      },
      "1002iPhone 13": {
        "1001LCD": {
          "Price": 229,
          "Tax": true
        },
        "1002Battery": {
          "Price": 119,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 139,
          "Tax": true
        }
      },
      "1003iPhone 12 Pro Max": {
        "1001LCD": {
          "Price": 199,
          "Tax": true
        },
        "1002Battery": {
          "Price": 119,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 129,
          "Tax": true
        }
      },
      "1004iPhone 12 Pro": {
        "1001LCD": {
          "Price": 179,
          "Tax": true
        },
        "1002Battery": {
          "Price": 119,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 129,
          "Tax": true
        }
      },
      "1005iPhone 12": {
        "1001LCD": {
          "Price": 179,
          "Tax": true
        },
        "1002Battery": {
          "Price": 119,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 129,
          "Tax": true
        }
      },
      "1006iPhone 11 Pro Max": {
        "1001LCD": {
          "Price": 179,
          "Tax": true
        },
        "1002Battery": {
          "Price": 129,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 139,
          "Tax": true
        }
      },
      "1007iPhone 11 Pro": {
        "1001LCD": {
          "Price": 159,
          "Tax": true
        },
        "1002Battery": {
          "Price": 119,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 119,
          "Tax": true
        }
      },
      "1008iPhone 11": {
        "1001LCD": {
          "Price": 149,
          "Tax": true
        },
        "1002Battery": {
          "Price": 99,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 99,
          "Tax": true
        }
      },
      "1009iPhone XS Max": {
        "1001LCD": {
          "Price": 149,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 99,
          "Tax": true
        }
      },
      "1010iPhone XS": {
        "1001LCD": {
          "Price": 149,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 99,
          "Tax": true
        }
      },
      "1011iPhone XR": {
        "1001LCD": {
          "Price": 139,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1012iPhone X": {
        "1001LCD": {
          "Price": 139,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1013iPhone SE 2020": {
        "1001LCD": {
          "Price": 99,
          "Tax": true
        },
        "1002Battery": {
          "Price": 59,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 79,
          "Tax": true
        }
      },
      "1014iPhone 8 Plus": {
        "1001LCD": {
          "Price": 109,
          "Tax": true
        },
        "1002Battery": {
          "Price": 59,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 79,
          "Tax": true
        }
      },
      "1015iPhone 8": {
        "1001LCD": {
          "Price": 99,
          "Tax": true
        },
        "1002Battery": {
          "Price": 59,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 79,
          "Tax": true
        }
      },
      "1016iPhone 7 Plus": {
        "1001LCD": {
          "Price": 89,
          "Tax": true
        },
        "1002Battery": {
          "Price": 59,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 79,
          "Tax": true
        }
      },
      "1017iPhone 7": {
        "1001LCD": {
          "Price": 79,
          "Tax": true
        },
        "1002Battery": {
          "Price": 59,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1018iPhone 6s Plus": {
        "1001LCD": {
          "Price": 79,
          "Tax": true
        },
        "1002Battery": {
          "Price": 59,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1019iPhone 6s": {
        "1001LCD": {
          "Price": 79,
          "Tax": true
        },
        "1002Battery": {
          "Price": 59,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1020iPhone 6 Plus": {
        "1001LCD": {
          "Price": 69,
          "Tax": true
        },
        "1002Battery": {
          "Price": 49,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1021iPhone 6": {
        "1001LCD": {
          "Price": 69,
          "Tax": true
        },
        "1002Battery": {
          "Price": 49,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      }
    },
    "1001Samsung": {
      "1000Galaxy S7": {
        "1001LCD": {
          "Price": 159,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 159,
          "Tax": true
        }
      },
      "1001Galaxy S7 Edge": {
        "1001LCD": {
          "Price": 199,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 199,
          "Tax": true
        }
      },
      "1002Galaxy S8": {
        "1001LCD": {
          "Price": 229,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1003Galaxy S8 Plus": {
        "1001LCD": {
          "Price": 239,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1004Galaxy S9": {
        "1001LCD": {
          "Price": 229,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1005Galaxy S9 Plus": {
        "1001LCD": {
          "Price": 239,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1006Galaxy S10": {
        "1001LCD": {
          "Price": 329,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1007Galaxy S10e": {
        "1001LCD": {
          "Price": 229,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1008Galaxy S10 Plus": {
        "1001LCD": {
          "Price": 329,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1009Galaxy S20": {
        "1001LCD": {
          "Price": 329,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1010Galaxy S20 Plus": {
        "1001LCD": {
          "Price": 339,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1011Galaxy Note 8": {
        "1001LCD": {
          "Price": 279,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 79,
          "Tax": true
        }
      },
      "1012Galaxy Note 9": {
        "1001LCD": {
          "Price": 279,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 79,
          "Tax": true
        }
      },
      "1013Galaxy Note 10": {
        "1001LCD": {
          "Price": 339,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 79,
          "Tax": true
        }
      },
      "1014Galaxy Note 20": {
        "1001LCD": {
          "Price": 299,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 79,
          "Tax": true
        }
      },
      "1015Galaxy J320": {
        "1001LCD": {
          "Price": 99,
          "Tax": true
        },
        "1002Battery": {
          "Price": 35,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 99,
          "Tax": true
        }
      },
      "1016Galaxy J327": {
        "1001LCD": {
          "Price": 99,
          "Tax": true
        },
        "1002Battery": {
          "Price": 35,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 99,
          "Tax": true
        }
      },
      "1017Galaxy J727": {
        "1001LCD": {
          "Price": 99,
          "Tax": true
        },
        "1002Battery": {
          "Price": 99,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 99,
          "Tax": true
        }
      },
      "1018Galaxy J737": {
        "1001LCD": {
          "Price": 99,
          "Tax": true
        },
        "1002Battery": {
          "Price": 99,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 99,
          "Tax": true
        }
      },
      "1019Galaxy A10": {
        "1001LCD": {
          "Price": 129,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1020Galaxy A20": {
        "1001LCD": {
          "Price": 129,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1021Galaxy A30": {
        "1001LCD": {
          "Price": 149,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1022Galaxy A50": {
        "1001LCD": {
          "Price": 149,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1023Galaxy A70": {
        "1001LCD": {
          "Price": 179,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 79,
          "Tax": true
        }
      },
      "1024Galaxy S4": {
        "1001LCD": {
          "Price": 89,
          "Tax": true
        },
        "1002Battery": {
          "Price": 30,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 49,
          "Tax": true
        }
      },
      "1025Galaxy S5": {
        "1001LCD": {
          "Price": 99,
          "Tax": true
        },
        "1002Battery": {
          "Price": 39,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 99,
          "Tax": true
        }
      },
      "1026Galaxy S5 Active": {
        "1001LCD": {
          "Price": 149,
          "Tax": true
        },
        "1002Battery": {
          "Price": 30,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 85,
          "Tax": true
        }
      },
      "1027Galaxy S6                   ": {
        "1001LCD": {
          "Price": 139,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 189,
          "Tax": true
        }
      },
      "1028Galaxy S6 Edge": {
        "1001LCD": {
          "Price": 159,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 79,
          "Tax": true
        }
      },
      "1029Galaxy S6 Active": {
        "1001LCD": {
          "Price": 199,
          "Tax": true
        },
        "1002Battery": {
          "Price": 30,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 85,
          "Tax": true
        }
      }
    },
    "1002Google": {
      "1000Pixel 7 Pro": {
        "1001LCD": {
          "Price": 319,
          "Tax": true
        },
        "1002Battery": {
          "Price": 129,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 129,
          "Tax": true
        }
      },
      "1001Pixel 7": {
        "1001LCD": {
          "Price": 279,
          "Tax": true
        },
        "1002Battery": {
          "Price": 119,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 119,
          "Tax": true
        }
      },
      "1002Pixel 6a": {
        "1001LCD": {
          "Price": 259,
          "Tax": true
        },
        "1002Battery": {
          "Price": 119,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 119,
          "Tax": true
        }
      },
      "1003Pixel 6 Pro": {
        "1001LCD": {
          "Price": 369,
          "Tax": true
        },
        "1002Battery": {
          "Price": 99,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1004Pixel 6": {
        "1001LCD": {
          "Price": 239,
          "Tax": true
        },
        "1002Battery": {
          "Price": 99,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1005Pixel 5a": {
        "1001LCD": {
          "Price": 229,
          "Tax": true
        },
        "1002Battery": {
          "Price": 99,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1006Pixel 5": {
        "1001LCD": {
          "Price": 269,
          "Tax": true
        },
        "1002Battery": {
          "Price": 99,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1007Pixel 4a": {
        "1001LCD": {
          "Price": 199,
          "Tax": true
        },
        "1002Battery": {
          "Price": 99,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1008Pixel 4 XL": {
        "1001LCD": {
          "Price": 199,
          "Tax": true
        },
        "1002Battery": {
          "Price": 89,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 79,
          "Tax": true
        }
      },
      "1009Pixel 4": {
        "1001LCD": {
          "Price": 159,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1010Pixel 3a XL": {
        "1001LCD": {
          "Price": 149,
          "Tax": true
        },
        "1002Battery": {
          "Price": 89,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1011Pixel 3a": {
        "1001LCD": {
          "Price": 159,
          "Tax": true
        },
        "1002Battery": {
          "Price": 89,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      },
      "1012Pixel 3 XL": {
        "1001LCD": {
          "Price": 169,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1013Pixel 3": {
        "1001LCD": {
          "Price": 169,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1014Pixel 2 XL": {
        "1001LCD": {
          "Price": 119,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1015Pixel 2": {
        "1001LCD": {
          "Price": 119,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      }
    },
    "1003LG": {
      "1000G8 ThinQ": {
        "1001LCD": {
          "Price": 189,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1001G7 ThinQ": {
        "1001LCD": {
          "Price": 139,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1002G6": {
        "1001LCD": {
          "Price": 129,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1003K40": {
        "1001LCD": {
          "Price": 99,
          "Tax": true
        },
        "1002Battery": {
          "Price": 59,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 59,
          "Tax": true
        }
      },
      "1004Stylo 6": {
        "1001LCD": {
          "Price": 129,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1005V40 ThinQ": {
        "1001LCD": {
          "Price": 159,
          "Tax": true
        },
        "1002Battery": {
          "Price": 69,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 69,
          "Tax": true
        }
      },
      "1006V30": {
        "1001LCD": {
          "Price": 179,
          "Tax": true
        },
        "1002Battery": {
          "Price": 79,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 79,
          "Tax": true
        }
      },
      "1007V20": {
        "1001LCD": {
          "Price": 99,
          "Tax": true
        },
        "1002Battery": {
          "Price": 49,
          "Tax": true
        },
        "1003Charge Port": {
          "Price": 89,
          "Tax": true
        }
      }
    },
    "1004Computer": {
      "1000Laptop": {
        "1001PC Tune-up": {
          "Price": 89,
          "Tax": true
        },
        "1002Hard Drive": {
          "Price": 159,
          "Tax": true
        },
        "1003Diagnostic": {
          "Price": 29,
          "Tax": true
        }
      },
      "1001Desktop": {
        "1001PC Tune-up": {
          "Price": 89,
          "Tax": true
        },
        "1002Hard Drive": {
          "Price": 169,
          "Tax": true
        },
        "1003Diagnostic": {
          "Price": 29,
          "Tax": true
        }
      },
      "1002MacBook": {
        "1001PC Tune-up": {
          "Price": 79,
          "Tax": true
        },
        "1002Hard Drive": {
          "Price": 159,
          "Tax": true
        },
        "1003Diagnostic": {
          "Price": 29,
          "Tax": true
        }
      },
      "1003iMac": {
        "1001PC Tune-up": {
          "Price": 79,
          "Tax": true
        },
        "1002Hard Drive": {
          "Price": 199,
          "Tax": true
        },
        "1003Diagnostic": {
          "Price": 49,
          "Tax": true
        }
      }
    }
  }
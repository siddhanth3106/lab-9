/**
 * Employee XML Data Parser & Tabular Viewer
 * Lab 9 - Web Technology
 */

// Global state
let employeesData = [];
let sortDirection = {};
let currentSortColumn = null;
let rawXmlContent = "";

// Fallback XML string for offline / file:// protocol access without a web server
const DEFAULT_XML_STRING = `<?xml version="1.0" encoding="UTF-8"?>
<company>
    <department_info name="Global Tech Solutions" year="2026"/>
    <employees>
        <employee id="EMP101">
            <name>Aarav Sharma</name>
            <department>Engineering</department>
            <designation>Senior Full Stack Developer</designation>
            <salary>95000</salary>
            <email>aarav.sharma@example.com</email>
            <joining_date>2021-03-15</joining_date>
            <status>Active</status>
        </employee>
        <employee id="EMP102">
            <name>Sneha Patel</name>
            <department>Product Design</department>
            <designation>Lead UI/UX Designer</designation>
            <salary>88000</salary>
            <email>sneha.patel@example.com</email>
            <joining_date>2020-07-01</joining_date>
            <status>Active</status>
        </employee>
        <employee id="EMP103">
            <name>Rohan Verma</name>
            <department>Engineering</department>
            <designation>DevOps Engineer</designation>
            <salary>91000</salary>
            <email>rohan.verma@example.com</email>
            <joining_date>2022-01-10</joining_date>
            <status>Active</status>
        </employee>
        <employee id="EMP104">
            <name>Priya Nair</name>
            <department>Human Resources</department>
            <designation>HR Operations Manager</designation>
            <salary>76000</salary>
            <email>priya.nair@example.com</email>
            <joining_date>2019-11-20</joining_date>
            <status>Active</status>
        </employee>
        <employee id="EMP105">
            <name>Vikram Malhotra</name>
            <department>Finance</department>
            <designation>Financial Analyst</designation>
            <salary>82000</salary>
            <email>vikram.m@example.com</email>
            <joining_date>2023-04-05</joining_date>
            <status>Active</status>
        </employee>
        <employee id="EMP106">
            <name>Ananya Iyer</name>
            <department>Marketing</department>
            <designation>Digital Marketing Lead</designation>
            <salary>79000</salary>
            <email>ananya.iyer@example.com</email>
            <joining_date>2021-09-18</joining_date>
            <status>Active</status>
        </employee>
        <employee id="EMP107">
            <name>Karan Joshi</name>
            <department>Data Science</department>
            <designation>Machine Learning Engineer</designation>
            <salary>105000</salary>
            <email>karan.joshi@example.com</email>
            <joining_date>2022-08-12</joining_date>
            <status>Active</status>
        </employee>
        <employee id="EMP108">
            <name>Meera Sen</name>
            <department>Quality Assurance</department>
            <designation>QA Automation Architect</designation>
            <salary>86000</salary>
            <email>meera.sen@example.com</email>
            <joining_date>2020-02-28</joining_date>
            <status>Active</status>
        </employee>
    </employees>
</company>`;

document.addEventListener("DOMContentLoaded", () => {
    // Attempt automatic load from employees.xml
    loadXmlFile("employees.xml", false);

    // Event Listeners
    document.getElementById("btnLoadDefault").addEventListener("click", () => {
        loadXmlFile("employees.xml", true);
    });

    document.getElementById("xmlFileInput").addEventListener("change", handleFileUpload);
    document.getElementById("searchInput").addEventListener("input", filterAndRender);
    document.getElementById("deptFilter").addEventListener("change", filterAndRender);
    document.getElementById("xmlToggleBtn").addEventListener("click", toggleXmlView);
    document.getElementById("btnExportCsv").addEventListener("click", exportToCSV);

    // Table sorting headers
    document.querySelectorAll("th[data-sort]").forEach(th => {
        th.addEventListener("click", () => {
            const column = th.getAttribute("data-sort");
            sortTable(column);
        });
    });
});

/**
 * Loads an XML file using fetch API.
 * Gracefully falls back to DOMParser with embedded default data if opened directly via file://
 */
function loadXmlFile(filePath, userTriggered = false) {
    showNotice("", "hide");

    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(xmlString => {
            rawXmlContent = xmlString;
            processXmlString(xmlString);
            showNotice("Successfully loaded XML data via HTTP Fetch request.", "info");
        })
        .catch(err => {
            console.warn("fetch() failed (commonly due to file:// CORS restriction in browser). Using fallback parser:", err);
            
            // Seamlessly process default XML string
            rawXmlContent = DEFAULT_XML_STRING;
            processXmlString(DEFAULT_XML_STRING);

            if (window.location.protocol === "file:") {
                showNotice(
                    "Loaded sample data. Note: When opening via file://, browser CORS policies block live fetch. You can also use 'Upload XML File' or run a local HTTP server.",
                    "warning"
                );
            } else if (userTriggered) {
                showNotice(`Failed to fetch ${filePath}: ${err.message}. Showing default sample data.`, "warning");
            }
        });
}

/**
 * Handles user file upload via <input type="file">
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".xml") && file.type !== "text/xml") {
        showNotice("Please select a valid .xml file.", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        rawXmlContent = e.target.result;
        processXmlString(rawXmlContent);
        showNotice(`Successfully loaded and parsed "${file.name}".`, "info");
    };
    reader.onerror = function() {
        showNotice("Error reading the selected file.", "error");
    };
    reader.readAsText(file);
}

/**
 * Parses raw XML text using DOMParser and extracts employee objects
 */
function processXmlString(xmlText) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");

        // Check for XML parsing syntax errors
        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
            throw new Error(parseError[0].textContent || "XML Syntax Error");
        }

        const employeeNodes = xmlDoc.getElementsByTagName("employee");
        if (employeeNodes.length === 0) {
            showNotice("No <employee> records found in the provided XML document.", "warning");
            employeesData = [];
            renderTable([]);
            updateStats([]);
            updateDepartmentFilter([]);
            return;
        }

        const parsedList = [];
        for (let i = 0; i < employeeNodes.length; i++) {
            const empNode = employeeNodes[i];

            // Helper to get text content from node by tag name
            const getTagValue = (tagName, defaultVal = "") => {
                const el = empNode.getElementsByTagName(tagName)[0];
                return el && el.textContent !== null ? el.textContent.trim() : defaultVal;
            };

            // Support either attribute id="EMP101" or child tag <id>EMP101</id>
            const id = empNode.getAttribute("id") || getTagValue("id", `EMP${100 + i}`);
            const name = getTagValue("name", "N/A");
            const department = getTagValue("department", "Unassigned");
            const designation = getTagValue("designation", "Staff");
            const salary = parseFloat(getTagValue("salary", "0")) || 0;
            const email = getTagValue("email", "-");
            const joiningDate = getTagValue("joining_date", "-");
            const status = getTagValue("status", "Active");

            parsedList.push({
                id,
                name,
                department,
                designation,
                salary,
                email,
                joiningDate,
                status
            });
        }

        employeesData = parsedList;
        updateDepartmentFilter(employeesData);
        updateStats(employeesData);
        filterAndRender();

        // Update raw XML preview
        const rawCodeEl = document.getElementById("rawXmlCode");
        if (rawCodeEl) {
            rawCodeEl.textContent = xmlText;
        }

    } catch (err) {
        console.error("XML Parsing Error:", err);
        showNotice(`Failed to parse XML: ${err.message}`, "error");
    }
}

/**
 * Updates summary KPI cards (Total Employees, Average Salary, Max Salary, Total Depts)
 */
function updateStats(data) {
    const totalCount = data.length;
    const totalSalary = data.reduce((sum, e) => sum + e.salary, 0);
    const avgSalary = totalCount > 0 ? Math.round(totalSalary / totalCount) : 0;
    const maxSalary = totalCount > 0 ? Math.max(...data.map(e => e.salary)) : 0;
    const uniqueDepts = new Set(data.map(e => e.department)).size;

    document.getElementById("statTotalEmployees").textContent = totalCount;
    document.getElementById("statAvgSalary").textContent = `$${avgSalary.toLocaleString()}`;
    document.getElementById("statMaxSalary").textContent = `$${maxSalary.toLocaleString()}`;
    document.getElementById("statTotalDepts").textContent = uniqueDepts;
}

/**
 * Dynamically builds department options in the filter dropdown
 */
function updateDepartmentFilter(data) {
    const deptSelect = document.getElementById("deptFilter");
    const currentVal = deptSelect.value;

    const departments = Array.from(new Set(data.map(e => e.department))).sort();
    
    // Clear existing except "All Departments"
    deptSelect.innerHTML = `<option value="">All Departments</option>`;
    departments.forEach(dept => {
        const opt = document.createElement("option");
        opt.value = dept;
        opt.textContent = dept;
        deptSelect.appendChild(opt);
    });

    if (departments.includes(currentVal)) {
        deptSelect.value = currentVal;
    }
}

/**
 * Filters the employee dataset based on search term and selected department, then renders
 */
function filterAndRender() {
    const query = document.getElementById("searchInput").value.toLowerCase().trim();
    const selectedDept = document.getElementById("deptFilter").value;

    let filtered = employeesData.filter(emp => {
        const matchesSearch = 
            emp.id.toLowerCase().includes(query) ||
            emp.name.toLowerCase().includes(query) ||
            emp.designation.toLowerCase().includes(query) ||
            emp.email.toLowerCase().includes(query) ||
            emp.department.toLowerCase().includes(query);

        const matchesDept = !selectedDept || emp.department === selectedDept;

        return matchesSearch && matchesDept;
    });

    // Apply active sort if present
    if (currentSortColumn) {
        const dir = sortDirection[currentSortColumn] === "asc" ? 1 : -1;
        filtered.sort((a, b) => {
            let valA = a[currentSortColumn];
            let valB = b[currentSortColumn];

            if (typeof valA === "string") valA = valA.toLowerCase();
            if (typeof valB === "string") valB = valB.toLowerCase();

            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
        });
    }

    renderTable(filtered);
}

/**
 * Renders the tabular data inside <tbody>
 */
function renderTable(list) {
    const tbody = document.getElementById("tableBody");
    const emptyState = document.getElementById("emptyState");
    const countBadge = document.getElementById("recordCount");

    countBadge.textContent = `${list.length} Records`;
    tbody.innerHTML = "";

    if (list.length === 0) {
        tbody.parentElement.style.display = "none";
        emptyState.style.display = "block";
        return;
    }

    tbody.parentElement.style.display = "table";
    emptyState.style.display = "none";

    list.forEach(emp => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><span class="emp-id">${escapeHtml(emp.id)}</span></td>
            <td>
                <span class="emp-name">${escapeHtml(emp.name)}</span>
            </td>
            <td><span class="dept-tag">${escapeHtml(emp.department)}</span></td>
            <td>${escapeHtml(emp.designation)}</td>
            <td class="salary-val">$${emp.salary.toLocaleString()}</td>
            <td><a href="mailto:${escapeHtml(emp.email)}" style="color: var(--primary); text-decoration: none;">${escapeHtml(emp.email)}</a></td>
            <td>${escapeHtml(emp.joiningDate)}</td>
            <td><span class="status-badge">${escapeHtml(emp.status)}</span></td>
        `;

        tbody.appendChild(tr);
    });
}

/**
 * Handles column sorting
 */
function sortTable(column) {
    if (currentSortColumn === column) {
        sortDirection[column] = sortDirection[column] === "asc" ? "desc" : "asc";
    } else {
        currentSortColumn = column;
        sortDirection[column] = "asc";
    }

    // Update table header icons
    document.querySelectorAll("th[data-sort]").forEach(th => {
        const col = th.getAttribute("data-sort");
        const iconSpan = th.querySelector(".sort-icon");
        if (col === currentSortColumn) {
            iconSpan.textContent = sortDirection[column] === "asc" ? "▲" : "▼";
        } else {
            iconSpan.textContent = "↕";
        }
    });

    filterAndRender();
}

/**
 * Toggles the XML source code accordion
 */
function toggleXmlView() {
    const wrapper = document.getElementById("xmlCodeWrapper");
    const btn = document.getElementById("xmlToggleBtn");
    const isOpen = wrapper.classList.toggle("open");
    
    const icon = btn.querySelector(".arrow-icon");
    if (icon) {
        icon.textContent = isOpen ? "▲" : "▼";
    }
}

/**
 * Exports current table records to CSV
 */
function exportToCSV() {
    if (!employeesData || employeesData.length === 0) {
        alert("No employee data to export.");
        return;
    }

    const headers = ["ID", "Name", "Department", "Designation", "Salary", "Email", "Joining Date", "Status"];
    const rows = employeesData.map(e => [
        `"${e.id}"`,
        `"${e.name}"`,
        `"${e.department}"`,
        `"${e.designation}"`,
        e.salary,
        `"${e.email}"`,
        `"${e.joiningDate}"`,
        `"${e.status}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employees_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Displays status / alert notifications
 */
function showNotice(message, type = "info") {
    const notice = document.getElementById("noticeMessage");
    if (type === "hide" || !message) {
        notice.className = "notice";
        notice.textContent = "";
        return;
    }

    notice.className = `notice notice-${type} show`;
    notice.textContent = message;
}

/**
 * Utility to prevent XSS injection from XML strings
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

# Lab 9: XML Employee Data Reader & Tabular Viewer

A modern, responsive web application designed to load, parse, and render structured XML employee data in an interactive tabular format.

---

## 📁 Project Structure

```
Lab 9/
│
├── index.html       # HTML5 structure, semantic markup, table layout, and controls
├── style.css        # Clean, modern CSS with responsive design & metrics cards
├── script.js        # JavaScript XML parser (DOMParser / Fetch / FileReader) & table interactions
├── employees.xml    # Sample XML document with company & employee records
└── README.md        # Documentation and running guide
```

---

## 🚀 How to Run the Application

### Option 1: Direct Double-Click (No setup required)
1. Double-click [index.html](file:///c:/Users/siddh/OneDrive/Documents/Lab%209/index.html) to open it directly in Google Chrome, Microsoft Edge, Firefox, or any modern browser.
2. The page loads with sample employee data right away.
3. You can click **"Upload Custom XML"** at any time to choose [employees.xml](file:///c:/Users/siddh/OneDrive/Documents/Lab%209/employees.xml) or any other XML file from your disk.

### Option 2: Using a Local HTTP Server (Recommended for Fetch API)
Because modern web browsers enforce CORS security restrictions when accessing local files via `file://`, running a lightweight HTTP server allows full dynamic `fetch()` requests:

Using Python:
```bash
python -m http.server 8000
```
Then navigate to: `http://localhost:8000`

Or using Node.js / `npx`:
```bash
npx serve .
```

---

## 💡 How It Works (Technical Overview)

1. **Reading XML**:
   - **Network / Local Server**: Uses JavaScript's `fetch("employees.xml")` to asynchronously retrieve the XML document.
   - **Local File Upload**: Uses `FileReader.readAsText()` via `<input type="file">`.
   - **Fallback**: Includes embedded sample data to guarantee 100% functionality even when double-clicked via `file://`.

2. **Parsing XML DOM**:
   - Converts raw XML strings into an XML Document Object using standard `DOMParser()`:
     ```javascript
     const parser = new DOMParser();
     const xmlDoc = parser.parseFromString(xmlText, "application/xml");
     ```
   - Checks for `parsererror` tags to detect and report XML syntax errors cleanly.
   - Extracts all `<employee>` nodes via `xmlDoc.getElementsByTagName("employee")`.
   - Reads node attributes (e.g. `emp.getAttribute("id")`) and child tag values (e.g. `<name>`, `<department>`, `<salary>`).

3. **Rendering & Interactivity**:
   - Dynamically constructs HTML `<tr>` and `<td>` elements and injects them into the `<tbody>`.
   - Computes statistical metrics (Total Employees, Average Salary, Max Salary, Department count).
   - Real-time client-side search across multiple fields (Name, ID, Role, Department, Email).
   - Dynamic department filter dropdown generated automatically from the XML data.
   - Multi-column sort (click any column header to toggle ascending/descending order).
   - "Inspect Raw XML Source Data" accordion to view the original XML alongside the parsed table.
   - "Export CSV" feature to download table records.

import React from "react";

const ReportPrint = ({ reports }) => {
  return (
    <>
      {/* ⬇️ STYLE TO REMOVE BROWSER HEADERS/FOOTERS & FORCE A4 */}
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0; /* This removes the date, title, url, page numbers */
            }
            body {
              margin: 0;
              padding: 0;
              background-color: white;
            }
            .printable-report-item {
              page-break-after: always;
              height: 297mm; /* Force exact A4 height */
              width: 210mm;
              overflow: hidden; /* Prevent spillover */
            }
            .printable-report-item:last-child {
              page-break-after: auto;
            }
          }
        `}
      </style>

      <div style={{
          fontFamily: "Arial, sans-serif",
          padding: "0",
          backgroundColor: "#fff",
          width: "210mm",
          boxSizing: "border-box",
          color: "#000"
        }}
      >
        {reports && reports.map((report, index) => (
          <div 
            key={report.id} 
            className="printable-report-item" 
            style={{ 
              marginBottom: "0", 
              pageBreakAfter: "always", 
              borderBottom: "none", 
              padding: "20mm", 
              minHeight: "297mm", 
              position: "relative",
              boxSizing: "border-box"
          }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
              <h2 style={{ margin: "0", fontSize: "18px", textTransform: "uppercase" }}>ACCOMPLISHMENT REPORT</h2>
              <p style={{ margin: "5px 0", fontSize: "12px" }}>OJT Management System</p>
            </div>

            {/* Meta Data */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "12px", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>
              <div>
                <strong>Intern:</strong> {report.userName}<br />
                <strong>Period:</strong> {report.date}
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>Type:</strong> <span style={{ textTransform: "uppercase" }}>{report.type}</span><br />
                <strong>Title:</strong> {report.title}
              </div>
            </div>

            {/* Content */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "14px", borderBottom: "1px solid #ccc", paddingBottom: "5px", marginBottom: "10px" }}>Activities & Tasks</h4>
              <p style={{ fontSize: "11px", lineHeight: "1.6", whiteSpace: "pre-wrap", textAlign: "justify" }}>
                {report.content}
              </p>
            </div>

            {/* Images Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginTop: "20px" }}>
              {report.images?.map((img, i) => (
                <div key={i} style={{ border: "1px solid #ddd", borderRadius: "4px", overflow: "hidden", height: "120px" }}>
                  <img src={img} alt="Evidence" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
            
            {/* Signatures */}
            <div style={{ position: "absolute", bottom: "20mm", left: "20mm", right: "20mm", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <div style={{ width: "40%", textAlign: "center" }}>
                 <div style={{ borderTop: "1px solid #000", marginTop: "40px", paddingTop: "5px", fontWeight: "bold" }}>{report.userName}</div>
                 <div>Intern Signature</div>
              </div>
              <div style={{ width: "40%", textAlign: "center" }}>
                 {/* ⬇️ UPDATED: Uses passed supervisorName or default line */}
                 <div style={{ borderTop: "1px solid #000", marginTop: "40px", paddingTop: "5px", fontWeight: "bold" }}>
                    {report.supervisorName && report.supervisorName !== "Unassigned" ? report.supervisorName : "_______________________"}
                 </div>
                 <div>Supervisor / Coordinator</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ReportPrint;
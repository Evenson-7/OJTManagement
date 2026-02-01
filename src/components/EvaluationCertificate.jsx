// fileName: EvaluationCertificate.jsx

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { HiOutlineArrowDownTray, HiOutlinePrinter } from "react-icons/hi2";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import toast from "react-hot-toast";

const EvaluationCertificate = ({ user, evaluation, intern }) => {
    
    // --- STATE ---
    const [certData, setCertData] = useState({
        leftLogo: "", 
        rightLogo: "", 
        schoolName: "YOUR UNIVERSITY NAME",
        schoolAddress: "123 University Avenue, City, Country",
        title: "CERTIFICATE OF COMPLETION",
        subTitle: "This certificate is proudly awarded to",
        studentName: '',
        bodyPart1: "For successfully completing the On-the-Job Training requirements",
        bodyPart2: "rendering a total of",
        hours: 0,
        bodyPart3: "hours out of",
        reqHours: 0,
        bodyPart4: "hours required.",
        dateLabel: "Given this",
        dateStr: '',
        sig1Name: '',
        sig2Name: '_______________________',
        sig3Name: '_______________________',
        sig1Role: "Industry Supervisor",
        sig2Role: "OJT Coordinator",
        sig3Role: "College Dean"
    });

    useEffect(() => {
        if (evaluation || intern) {
            const name = intern?.name || (intern?.firstName ? `${intern.firstName} ${intern.lastName}` : "") || evaluation?.internName || "STUDENT NAME";
            const h = intern?.totalHours || intern?.totalHoursCompleted || 0;
            const rh = intern?.requiredHours || 0;
            const d = evaluation?.submittedAt 
                ? new Date(evaluation.submittedAt.toDate()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            
            const supName = evaluation?.supervisorName || user?.name || "Supervisor Name";

            setCertData(prev => ({
                ...prev,
                studentName: name,
                hours: h,
                reqHours: rh,
                dateStr: d,
                sig1Name: supName,
            }));
        }
    }, [evaluation, intern, user]);

    const handleChange = (field, value) => {
        setCertData(prev => ({ ...prev, [field]: value }));
    };

    const handleLogoClick = (side) => {
        const url = prompt(`Enter URL for ${side} logo:`, certData[side]);
        if (url !== null) handleChange(side, url); 
    };

    // --- EXPORT & PRINT LOGIC ---

    const handlePrint = () => {
        const input = document.getElementById("certificate-visual");
        if (!input) return toast.error("Certificate not found");
    
        const printWindow = window.open('', '', 'width=1200,height=800');
        if (!printWindow) return toast.error("Pop-up blocked. Please allow pop-ups.");
    
        // Extract HTML
        const content = input.outerHTML;
    
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Certificate</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                /* FORCE LANDSCAPE & REMOVE MARGINS */
                @page { 
                    size: landscape; 
                    margin: 0; 
                }
                body { 
                    margin: 0; 
                    padding: 0; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh;
                    background-color: white;
                    -webkit-print-color-adjust: exact; 
                }
                /* Hide the 'Add Logo' buttons on print */
                .hide-on-export { display: none !important; }
              </style>
            </head>
            <body>
              ${content}
              <script>
                setTimeout(() => {
                    window.focus();
                    window.print();
                    window.close();
                }, 800); // Small delay to allow images to render
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
    };

    const handlePDF = () => {
        const input = document.getElementById("certificate-visual");
        if (!input) return toast.error("Certificate element not found");
        
        const filename = `Certificate_${certData.studentName.replace(/\s+/g, '_')}`;

        toast.loading("Generating PDF...", { id: "pdf-toast" });
    
        setTimeout(async () => {
            try {
                // A4 Landscape Dimensions (96 DPI)
                const width = 1123;
                const height = 794;
    
                // 1. Create a "Sandbox" Wrapper
                const wrapper = document.createElement('div');
                wrapper.style.position = 'fixed';
                wrapper.style.top = '-10000px';
                wrapper.style.left = '-10000px';
                wrapper.style.width = `${width}px`;
                wrapper.style.height = `${height}px`;
                wrapper.style.zIndex = '-9999';
                wrapper.style.overflow = 'hidden';
                
                // 2. Clone the Certificate
                const clone = input.cloneNode(true);
                
                // 3. Force Clone Styles
                clone.style.width = '100%';
                clone.style.height = '100%';
                clone.style.margin = '0';
                clone.style.padding = '0';
                clone.style.transform = 'none';
                clone.style.overflow = 'hidden';
                
                // Remove "Add Logo" placeholders and edit cursors from the PDF
                const placeholders = clone.querySelectorAll('.hide-on-export');
                placeholders.forEach(el => el.style.display = 'none');
                
                // Convert all input fields to div elements for clean PDF rendering
                const inputs = clone.querySelectorAll('input');
                inputs.forEach(input => {
                    const div = document.createElement('div');
                    div.textContent = input.value;
                    div.className = input.className;
                    div.style.cssText = input.style.cssText;
                    
                    // Ensure proper styling for converted divs
                    div.style.border = 'none';
                    div.style.outline = 'none';
                    div.style.caretColor = 'transparent';
                    
                    // Preserve border-bottom for underlined fields
                    if (input.className.includes('border-b')) {
                        div.style.borderBottom = input.style.borderBottom || '2px solid black';
                    }
                    
                    // Preserve border-top for signature lines
                    if (input.className.includes('border-t')) {
                        div.style.borderTop = input.style.borderTop || '2px solid black';
                    }
                    
                    input.parentNode.replaceChild(div, input);
                });
    
                // 4. Mount & Capture
                wrapper.appendChild(clone);
                document.body.appendChild(wrapper);
    
                // Small delay to ensure all styles are applied
                await new Promise(resolve => setTimeout(resolve, 100));
    
                const canvas = await html2canvas(clone, {
                    scale: 2.5, // High resolution (renders at approx 300 DPI)
                    width: width,
                    height: height,
                    windowWidth: width,
                    windowHeight: height,
                    backgroundColor: "#ffffff",
                    useCORS: true,
                    logging: false,
                    imageTimeout: 0,
                    removeContainer: false
                });
    
                // 5. Cleanup
                document.body.removeChild(wrapper);
    
                // 6. Generate PDF
                const imgData = canvas.toDataURL('image/png', 1.0);
                const pdf = new jsPDF('l', 'px', [width, height]); // 'l' = Landscape
                pdf.addImage(imgData, 'PNG', 0, 0, width, height, '', 'FAST');
                pdf.save(`${filename}.pdf`);
    
                toast.dismiss("pdf-toast");
                toast.success("PDF Downloaded");
            } catch (err) {
                console.error("PDF Export Error:", err);
                toast.error("Failed to export PDF");
                toast.dismiss("pdf-toast");
                // Emergency Cleanup
                const orphans = document.querySelectorAll('[style*="top: -10000px"]');
                orphans.forEach(o => o.remove());
            }
        }, 500);
    };

    if (!user) return <Loader2 className="animate-spin text-gray-400" size={32} />;

    if (evaluation) {
        return (
            <div className="flex flex-col items-center gap-6">
                
                {/* --- CONTROLS (Hidden during export) --- */}
                <div className="flex gap-4 p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                    <button 
                        onClick={handlePDF} 
                        className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 hover:text-gray-900 transition-colors font-semibold shadow-sm"
                    >
                        <HiOutlineArrowDownTray className="w-5 h-5" /> 
                        Export PDF
                    </button>

                    <button 
                        onClick={handlePrint}
                        className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 hover:text-gray-900 transition-colors font-semibold shadow-sm"
                    >
                        <HiOutlinePrinter className="w-5 h-5" /> 
                        Print
                    </button>
                </div>

                {/* --- CERTIFICATE VISUAL --- */}
                <div 
                    id="certificate-visual"
                    className="bg-white mx-auto text-black relative shadow-lg" 
                    // CRITICAL: Force A4 Landscape Dimensions (1123px x 794px)
                    // 'overflow-hidden' prevents scrollbars from ruining the screenshot
                    style={{ 
                        width: '1123px', 
                        height: '794px', 
                        minWidth: '1123px', 
                        minHeight: '794px',
                        overflow: 'hidden' 
                    }} 
                > 
                    {/* Outer Border */}
                    <div className="w-full h-full border-[12px] border-[#002B66] p-2 box-border">
                        {/* Inner Gold Border */}
                        <div className="w-full h-full border-[3px] border-[#daa520] relative box-border flex flex-col justify-between pt-8 pb-8 px-12">
                            
                            {/* --- ROW 1: HEADER (Fixed Height: 150px) --- */}
                            <div style={{ height: '150px', position: 'relative', width: '100%' }}>
                                
                                {/* LEFT LOGO */}
                                <div className="absolute left-0 top-0 z-20" onClick={() => handleLogoClick('leftLogo')}>
                                    {certData.leftLogo ? (
                                        <img src={certData.leftLogo} alt="Left" className="h-28 w-28 object-contain" />
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-full h-24 w-24 flex items-center justify-center text-xs text-gray-400 p-2 hide-on-export cursor-pointer hover:bg-gray-50">
                                            Add Logo
                                        </div>
                                    )}
                                </div>

                                {/* CENTER TEXT */}
                                <div className="absolute left-0 right-0 top-2 flex flex-col items-center justify-center z-10 mx-auto w-[600px]">
                                    <input 
                                        type="text" 
                                        value={certData.schoolName}
                                        onChange={(e) => handleChange('schoolName', e.target.value)}
                                        className="w-full text-center text-3xl font-bold text-[#002B66] uppercase tracking-wide font-sans bg-transparent border-none focus:outline-none placeholder-[#002B66]"
                                        style={{ caretColor: '#002B66' }}
                                    />
                                    <input 
                                        type="text" 
                                        value={certData.schoolAddress}
                                        onChange={(e) => handleChange('schoolAddress', e.target.value)}
                                        className="w-full text-center text-lg text-gray-600 mt-1 bg-transparent border-none focus:outline-none"
                                        style={{ caretColor: '#666' }}
                                    />
                                </div>

                                {/* RIGHT LOGO */}
                                <div className="absolute right-0 top-0 z-20" onClick={() => handleLogoClick('rightLogo')}>
                                    {certData.rightLogo ? (
                                        <img src={certData.rightLogo} alt="Right" className="h-28 w-28 object-contain" />
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-full h-24 w-24 flex items-center justify-center text-xs text-gray-400 p-2 hide-on-export cursor-pointer hover:bg-gray-50">
                                            Add Logo
                                        </div>
                                    )}
                                </div>
                                
                                {/* Divider Line */}
                                <div className="absolute bottom-0 left-10 right-10 border-b border-gray-200"></div>
                            </div>

                            {/* --- ROW 2: TITLE (Fixed Height: 100px) --- */}
                            <div style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <input 
                                    type="text" 
                                    value={certData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    className="w-full text-center text-5xl font-bold text-[#002B66] uppercase tracking-[0.2em] font-sans bg-transparent border-none focus:outline-none"
                                    style={{ caretColor: '#002B66' }}
                                />
                                <input 
                                    type="text" 
                                    value={certData.subTitle}
                                    onChange={(e) => handleChange('subTitle', e.target.value)}
                                    className="w-full text-center text-xl italic text-gray-600 mt-1 bg-transparent border-none focus:outline-none"
                                    style={{ caretColor: '#666' }}
                                />
                            </div>

                            {/* --- ROW 3: STUDENT NAME (Fixed Height: 120px) --- */}
                            <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <input 
                                    type="text" 
                                    value={certData.studentName}
                                    onChange={(e) => handleChange('studentName', e.target.value)}
                                    className="w-[90%] text-center text-[4rem] leading-none font-bold text-black border-b border-gray-300 pb-2 bg-transparent focus:outline-none uppercase font-[serif]"
                                    style={{ caretColor: '#000' }}
                                />
                            </div>

                            {/* --- ROW 4: BODY TEXT (Fixed Height: 150px) --- */}
                            <div style={{ height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'start', paddingTop: '10px' }}>
                                <input 
                                    type="text" 
                                    value={certData.bodyPart1}
                                    onChange={(e) => handleChange('bodyPart1', e.target.value)}
                                    className="w-full text-center bg-transparent border-none focus:outline-none text-xl text-gray-800"
                                    style={{ caretColor: '#444' }}
                                />
                                
                                {/* Stats Line - Fixed Layout */}
                                <div className="flex justify-center items-baseline gap-2 mt-4 text-xl text-gray-800 w-full flex-wrap">
                                    <span className="whitespace-nowrap">rendering a total of</span>
                                    <div className="relative inline-flex items-baseline">
                                        <input 
                                            type="number" 
                                            value={certData.hours}
                                            onChange={(e) => handleChange('hours', e.target.value)}
                                            className="font-bold text-center w-20 border-b-2 border-black bg-transparent focus:outline-none text-2xl px-1"
                                            style={{ 
                                                caretColor: '#000',
                                                MozAppearance: 'textfield',
                                                WebkitAppearance: 'none'
                                            }}
                                        />
                                    </div>
                                    <span className="whitespace-nowrap">hours out of</span>
                                    <div className="relative inline-flex items-baseline">
                                        <input 
                                            type="number" 
                                            value={certData.reqHours}
                                            onChange={(e) => handleChange('reqHours', e.target.value)}
                                            className="font-bold text-center w-20 border-b-2 border-black bg-transparent focus:outline-none text-2xl px-1"
                                            style={{ 
                                                caretColor: '#000',
                                                MozAppearance: 'textfield',
                                                WebkitAppearance: 'none'
                                            }}
                                        />
                                    </div>
                                    <span className="whitespace-nowrap">hours required.</span>
                                </div>

                                {/* Date Line */}
                                <div className="flex justify-center items-baseline gap-2 mt-4 text-xl text-gray-800">
                                    <span>Given this</span>
                                    <input 
                                        type="text" 
                                        value={certData.dateStr}
                                        onChange={(e) => handleChange('dateStr', e.target.value)}
                                        className="font-bold text-center w-72 border-b-2 border-black bg-transparent focus:outline-none text-xl px-2"
                                        style={{ caretColor: '#000' }}
                                    />
                                    <span>.</span>
                                </div>
                            </div>

                            {/* --- ROW 5: SIGNATURES (Fixed Height: 100px) --- */}
                            <div style={{ height: '100px', display: 'flex', justifyContent: 'space-between', paddingLeft: '40px', paddingRight: '40px', gap: '20px', alignItems: 'end' }}>
                                {[1, 2, 3].map(num => (
                                    <div key={num} className="text-center flex-1 flex flex-col items-center">
                                        <input 
                                            type="text" 
                                            value={certData[`sig${num}Name`]}
                                            onChange={(e) => handleChange(`sig${num}Name`, e.target.value)}
                                            className="w-full font-bold text-xl text-center border-t-2 border-black pt-2 bg-transparent focus:outline-none"
                                            style={{ caretColor: '#000' }}
                                        />
                                        <input 
                                            type="text" 
                                            value={certData[`sig${num}Role`]}
                                            onChange={(e) => handleChange(`sig${num}Role`, e.target.value)}
                                            className="w-full text-sm text-gray-500 italic text-center bg-transparent border-none focus:outline-none"
                                            style={{ caretColor: '#666' }}
                                        />
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>

                    {/* Hide number input spinners for export */}
                    <style>{`
                        input[type=number]::-webkit-inner-spin-button,
                        input[type=number]::-webkit-outer-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                        }
                        input[type=number] {
                            -moz-appearance: textfield;
                        }
                    `}</style>
                </div>
            </div>
        );
    }
    return null;
};

export default EvaluationCertificate;
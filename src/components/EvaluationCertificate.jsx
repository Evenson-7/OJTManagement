// fileName: EvaluationCertificate.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { HiOutlineArrowDownTray, HiOutlinePrinter, HiOutlineCloudArrowUp } from "react-icons/hi2";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import toast from "react-hot-toast";
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const EvaluationCertificate = ({ user, evaluation, intern }) => {
    const isSupervisor = user.role === 'supervisor';
    const isCoordinator = user.role === 'coordinator';
    
    const [isIssued, setIsIssued] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [calculatedHours, setCalculatedHours] = useState(0);

    const leftLogoInputRef = useRef(null);
    const rightLogoInputRef = useRef(null);
    const signatureInputRef = useRef(null);

    const [certData, setCertData] = useState({
        leftLogo: "/tlc-logo.png", 
        rightLogo: "", 
        signatureImage: "signature (1).png", 
        schoolName: "THE LEWIS COLLEGE",
        schoolAddress: "479 Magsaysay St., Cogon, Sorsogon City",
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
        sig1Role: "Industry Supervisor"
    });

    useEffect(() => {
        const fetchExactHours = async () => {
            if (!intern?.uid) return;
            try {
                const attQuery = query(collection(db, "attendance"), where("internId", "==", intern.uid));
                const attDocs = await getDocs(attQuery);
                let total = 0;
                attDocs.forEach(d => {
                    const hw = d.data().hoursWorked;
                    if (hw) total += parseFloat(hw);
                });
                setCalculatedHours(total);
            } catch (error) {
                console.error("Error fetching exact hours:", error);
            }
        };
        fetchExactHours();
    }, [intern]);

    useEffect(() => {
        const defaultLeft = "/tlc-logo.png";
        let autoRightLogo = "";
        const dept = String(intern?.departmentId || "").toUpperCase();
        if (dept.includes("CTE") || dept.includes("EDUC")) autoRightLogo = "/cte-logo.png";

        if (evaluation?.certificateData) {
            setCertData({
                ...evaluation.certificateData,
                leftLogo: evaluation.certificateData.leftLogo || defaultLeft,
                rightLogo: evaluation.certificateData.rightLogo || autoRightLogo,
                hours: parseFloat(evaluation.certificateData.hours || 0),
                reqHours: parseFloat(evaluation.certificateData.reqHours || 0)
            });
            setIsIssued(evaluation.certificateIssued || false);
            setIsEditing(isSupervisor && !evaluation.certificateIssued);
        } else if (evaluation || intern) {
            const name = intern?.name || (intern?.firstName ? `${intern.firstName} ${intern.lastName}` : "") || evaluation?.internName || "STUDENT NAME";
            const rh = intern?.requiredHours || 486;
            const d = evaluation?.submittedAt ? new Date(evaluation.submittedAt.toDate()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const supName = evaluation?.supervisorName || user?.name || "Supervisor Name";
            
            setCertData(prev => ({ 
                ...prev, 
                studentName: name, 
                hours: calculatedHours > 0 ? parseFloat(calculatedHours.toFixed(2)) : prev.hours, 
                reqHours: rh, 
                dateStr: d, 
                sig1Name: supName,
                leftLogo: defaultLeft,
                rightLogo: autoRightLogo || prev.rightLogo
            }));
            
            setIsIssued(false);
            setIsEditing(isSupervisor);
        }
    }, [evaluation, intern, user, isSupervisor, calculatedHours]);

    const handleChange = (field, value) => { if (!isEditing) return; setCertData(prev => ({ ...prev, [field]: value })); };

    const handleLogoClick = (side) => {
        if (!isEditing) return;
        if (side === 'leftLogo' && leftLogoInputRef.current) leftLogoInputRef.current.click();
        if (side === 'rightLogo' && rightLogoInputRef.current) rightLogoInputRef.current.click();
        if (side === 'signatureImage' && signatureInputRef.current) signatureInputRef.current.click();
    };

    const handleFileChange = (event, side) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 512000) { toast.error("Image is too large for the database. Please use a file under 500KB."); return; }
        
        const reader = new FileReader();
        reader.onloadend = () => { handleChange(side, reader.result); toast.success("Image uploaded successfully!"); };
        reader.readAsDataURL(file);
    };

    const saveCertificate = async (issueStatus) => {
        setIsSaving(true);
        try {
            const evalRef = doc(db, "evaluations", evaluation.id);
            await updateDoc(evalRef, { certificateData: certData, certificateIssued: issueStatus, certificateUpdatedAt: serverTimestamp() });
            setIsIssued(issueStatus); setIsEditing(!issueStatus);
            toast.success(issueStatus ? "Certificate Officially Issued!" : "Draft Saved Successfully");
        } catch (err) { console.error(err); toast.error("Failed to save certificate. Make sure images are small."); } finally { setIsSaving(false); }
    };

    const handlePrint = () => {
        const input = document.getElementById("certificate-visual");
        if (!input) return toast.error("Certificate not found");
        const printWindow = window.open('', '', 'width=1200,height=800');
        if (!printWindow) return toast.error("Pop-up blocked.");
        const content = input.outerHTML;
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Certificate</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { size: A4 landscape; margin: 0mm; }
                        body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white; }
                        #certificate-visual { width: 297mm !important; height: 210mm !important; min-width: 0 !important; min-height: 0 !important; box-shadow: none !important; transform: scale(0.95); transform-origin: center center; }
                        .hide-on-export { display: none !important; }
                        input { border: none !important; outline: none !important; background: transparent !important; }
                    </style>
                </head>
                <body>${content}<script>setTimeout(() => { window.print(); window.close(); }, 800);</script></body>
            </html>
        `);
        printWindow.document.close();
    };

    const handlePDF = () => {
        const input = document.getElementById("certificate-visual");
        if (!input) return toast.error("Certificate not found");
        toast.loading("Generating PDF...", { id: "pdf-toast" });
        setTimeout(async () => {
            try {
                const width = 1123; const height = 794;
                const wrapper = document.createElement('div'); wrapper.style.position = 'fixed'; wrapper.style.top = '-10000px'; wrapper.style.width = `${width}px`; wrapper.style.height = `${height}px`; wrapper.style.zIndex = '-9999';
                const clone = input.cloneNode(true); clone.style.transform = 'none';
                clone.querySelectorAll('.hide-on-export').forEach(el => el.style.display = 'none');
                clone.querySelectorAll('input').forEach(input => { const div = document.createElement('div'); div.textContent = input.value; div.className = input.className; div.style.cssText = input.style.cssText; div.style.border = 'none'; div.style.outline = 'none'; if (input.className.includes('border-b')) div.style.borderBottom = input.style.borderBottom || '2px solid black'; if (input.className.includes('border-t')) div.style.borderTop = input.style.borderTop || '2px solid black'; input.parentNode.replaceChild(div, input); });
                wrapper.appendChild(clone); document.body.appendChild(wrapper);
                const canvas = await html2canvas(clone, { scale: 2, width: width, height: height, useCORS: true, logging: false });
                document.body.removeChild(wrapper);
                const imgData = canvas.toDataURL('image/png'); const pdf = new jsPDF('l', 'px', [width, height]); pdf.addImage(imgData, 'PNG', 0, 0, width, height); pdf.save(`Certificate_${certData.studentName.replace(/\s+/g, '_')}.pdf`); toast.dismiss("pdf-toast"); toast.success("PDF Downloaded");
            } catch (err) { console.error(err); toast.error("Failed to export PDF"); toast.dismiss("pdf-toast"); }
        }, 500);
    };

    if (!user) return <Loader2 className="animate-spin text-gray-400" size={32} />;

    return (
        <div className="flex flex-col items-center gap-4 py-4 w-full">
            <input type="file" ref={leftLogoInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, 'leftLogo')} />
            <input type="file" ref={rightLogoInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, 'rightLogo')} />
            <input type="file" ref={signatureInputRef} style={{ display: 'none' }} accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, 'signatureImage')} />
            
            <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-[1123px] gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200 no-print">
                <div className="flex items-center gap-3">
                    {/* FIX 1: Cleaned up badge logic to prevent Coordinator confusion */}
                    {isIssued && <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-black tracking-wide uppercase flex items-center gap-2 shadow-sm">✅ Officially Issued</span>}
                    {!isIssued && isSupervisor && <span className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-black tracking-wide uppercase flex items-center gap-2 shadow-sm">📝 Draft Mode (Not Sent)</span>}
                    {!isIssued && isCoordinator && <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-black tracking-wide uppercase flex items-center gap-2 shadow-sm">🎓 Certificate Preview</span>}
                </div>
                
                <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
                    {isSupervisor && (
                        <>{isEditing ? (<>
                                {isIssued && <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg font-bold transition-colors">Cancel Edit</button>}
                                <button onClick={() => saveCertificate(false)} disabled={isSaving} className="px-4 py-2 text-sm border-2 border-[#0094FF] text-[#0094FF] hover:bg-blue-50 rounded-lg font-bold transition-colors disabled:opacity-50">Save Draft</button>
                                <button onClick={() => saveCertificate(true)} disabled={isSaving} className="px-5 py-2 text-sm bg-yellow-500 text-white hover:bg-yellow-600 rounded-lg font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 tracking-wide">⭐ ISSUE & SEND</button>
                        </>) : (<button onClick={() => setIsEditing(true)} className="px-5 py-2 text-sm bg-gray-900 text-white hover:bg-black rounded-lg font-bold transition-all shadow-md active:scale-95 tracking-wide">✏️ Edit Certificate</button>)}</>
                    )}
                    
                    {/* FIX 2: Allow Print/PDF for Coordinator immediately upon opening */}
                    {(isIssued || isSupervisor || isCoordinator) && (<>
                            <div className="w-px h-8 bg-gray-200 mx-2 hidden md:block"></div>
                            <button onClick={handlePDF} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 hover:text-[#0094FF] transition-colors text-sm font-bold shadow-sm"><HiOutlineArrowDownTray className="w-4 h-4" /> PDF</button>
                            <button onClick={handlePrint} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 hover:text-[#0094FF] transition-colors text-sm font-bold shadow-sm"><HiOutlinePrinter className="w-4 h-4" /> Print</button>
                    </>)}
                </div>
            </div>
            
            <div id="certificate-visual" className={`bg-white mx-auto text-black relative transition-shadow ${isEditing ? 'shadow-[0_0_30px_rgba(0,148,255,0.3)] ring-2 ring-[#0094FF]' : 'shadow-2xl'}`} style={{ width: '1123px', height: '794px', minWidth: '1123px', minHeight: '794px', overflow: 'hidden' }}> 
                <div className="w-full h-full border-[10px] border-[#002B66] p-2 box-border">
                    {/* FIX 3: Reduced padding (pb-4 instead of pb-10) to prevent overflow at the bottom */}
                    <div className="w-full h-full border-[3px] border-[#daa520] relative box-border flex flex-col pt-8 pb-4 px-12">
                        
                        <div className="flex justify-between items-center w-full">
                            <div className="w-32 h-32 flex shrink-0 cursor-pointer" onClick={() => handleLogoClick('leftLogo')}>
                                {certData.leftLogo ? ( 
                                    <img src={certData.leftLogo} alt="Left Logo" className="h-full w-full object-contain" onError={(e) => e.target.style.display = 'none'} /> 
                                ) : isEditing ? ( 
                                    <div className="border-2 border-dashed border-gray-300 rounded-full h-full w-full flex items-center justify-center text-xs text-gray-400 p-2 hide-on-export hover:bg-gray-50 transition-colors flex-col text-center leading-tight"><HiOutlineCloudArrowUp className="w-6 h-6 mb-1"/>Upload Logo</div> 
                                ) : null}
                            </div>
                            
                            <div className="flex flex-col items-center justify-center flex-1 px-4">
                                <input readOnly={!isEditing} type="text" value={certData.schoolName} onChange={(e) => handleChange('schoolName', e.target.value)} className={`w-full text-center text-4xl font-black text-[#002B66] tracking-widest font-[serif] bg-transparent border-none focus:outline-none placeholder-[#002B66] ${isEditing ? 'hover:bg-blue-50/50 rounded' : ''}`} style={{ caretColor: '#002B66' }} />
                                <input readOnly={!isEditing} type="text" value={certData.schoolAddress} onChange={(e) => handleChange('schoolAddress', e.target.value)} className={`w-full text-center text-lg font-medium text-gray-800 mt-1 bg-transparent border-none focus:outline-none ${isEditing ? 'hover:bg-blue-50/50 rounded' : ''}`} style={{ caretColor: '#333' }} />
                            </div>
                            
                            <div className="w-32 h-32 flex shrink-0 cursor-pointer" onClick={() => handleLogoClick('rightLogo')}>
                                {certData.rightLogo ? ( 
                                    <img src={certData.rightLogo} alt="Right Logo" className="h-full w-full object-contain" onError={(e) => e.target.style.display = 'none'} /> 
                                ) : isEditing ? ( 
                                    <div className="border-2 border-dashed border-gray-300 rounded-full h-full w-full flex items-center justify-center text-xs text-gray-400 p-2 hide-on-export hover:bg-gray-50 transition-colors flex-col text-center leading-tight"><HiOutlineCloudArrowUp className="w-6 h-6 mb-1"/>Upload Dept</div> 
                                ) : null}
                            </div>
                        </div>

                        {/* FIX 4: Reduced margins to bring contents up slightly */}
                        <div className="w-[90%] mx-auto border-b-[3px] border-[#002B66] mt-2 mb-6"></div>

                        <div className="flex flex-col items-center justify-center w-full mb-6">
                            <input readOnly={!isEditing} type="text" value={certData.title} onChange={(e) => handleChange('title', e.target.value)} className={`w-full text-center text-[3.2rem] font-bold text-[#002B66] uppercase tracking-widest font-sans bg-transparent border-none focus:outline-none ${isEditing ? 'hover:bg-blue-50/50 rounded' : ''}`} style={{ caretColor: '#002B66' }} />
                            <input readOnly={!isEditing} type="text" value={certData.subTitle} onChange={(e) => handleChange('subTitle', e.target.value)} className={`w-full text-center text-xl italic text-gray-700 mt-2 bg-transparent border-none focus:outline-none ${isEditing ? 'hover:bg-blue-50/50 rounded' : ''}`} style={{ caretColor: '#666' }} />
                        </div>

                        <div className="flex justify-center items-center w-full mb-6">
                            <input readOnly={!isEditing} type="text" value={certData.studentName} onChange={(e) => handleChange('studentName', e.target.value)} className={`w-[85%] text-center text-[4rem] leading-tight font-bold text-black border-b border-gray-400 pb-1 bg-transparent focus:outline-none uppercase font-[serif] ${isEditing ? 'hover:bg-blue-50/50 border-blue-300' : ''}`} style={{ caretColor: '#000' }} />
                        </div>

                        <div className="flex flex-col items-center justify-center flex-1">
                            <input readOnly={!isEditing} type="text" value={certData.bodyPart1} onChange={(e) => handleChange('bodyPart1', e.target.value)} className={`w-full text-center bg-transparent border-none focus:outline-none text-[1.35rem] text-gray-800 ${isEditing ? 'hover:bg-blue-50/50 rounded' : ''}`} style={{ caretColor: '#444' }} />
                            
                            <div className="flex justify-center items-baseline gap-3 mt-4 text-[1.35rem] text-gray-800 w-full flex-wrap">
                                <span className="whitespace-nowrap">rendering a total of</span>
                                <input readOnly={!isEditing} type="number" value={certData.hours} onChange={(e) => handleChange('hours', e.target.value)} className={`font-bold text-center w-32 border-b-2 bg-transparent focus:outline-none text-2xl px-1 ${isEditing ? 'border-[#0094FF] bg-blue-50' : 'border-black'}`} style={{ caretColor: '#000', MozAppearance: 'textfield', WebkitAppearance: 'none' }} />
                                <span className="whitespace-nowrap">hours out of</span>
                                <input readOnly={!isEditing} type="number" value={certData.reqHours} onChange={(e) => handleChange('reqHours', e.target.value)} className={`font-bold text-center w-28 border-b-2 bg-transparent focus:outline-none text-2xl px-1 ${isEditing ? 'border-[#0094FF] bg-blue-50' : 'border-black'}`} style={{ caretColor: '#000', MozAppearance: 'textfield', WebkitAppearance: 'none' }} />
                                <span className="whitespace-nowrap">hours required.</span>
                            </div>

                            <div className="flex justify-center items-baseline gap-3 mt-4 text-[1.35rem] text-gray-800">
                                <span>Given this</span>
                                <input readOnly={!isEditing} type="text" value={certData.dateStr} onChange={(e) => handleChange('dateStr', e.target.value)} className={`font-bold text-center w-80 border-b-2 bg-transparent focus:outline-none text-xl px-2 ${isEditing ? 'border-[#0094FF] bg-blue-50' : 'border-black'}`} style={{ caretColor: '#000' }} />
                                <span>.</span>
                            </div>
                        </div>
                        
                        {/* FIX 5: Reduced bottom padding (pb-2) to pull signature block up from the border */}
                        <div className="mt-auto flex justify-center w-full pb-2">
                            <div className="text-center flex flex-col items-center w-[350px]">
                                
                                <div className="h-24 w-full flex items-end justify-center cursor-pointer mb-1" onClick={() => handleLogoClick('signatureImage')}>
                                    {certData.signatureImage ? ( 
                                        <img src={certData.signatureImage} alt="Signature" className="max-h-24 max-w-full object-contain drop-shadow-sm" /> 
                                    ) : isEditing ? ( 
                                        <div className="border-2 border-dashed border-gray-300 rounded h-16 w-64 flex flex-col items-center justify-center text-xs text-gray-400 hide-on-export hover:bg-gray-50 transition-colors bg-white/50 backdrop-blur-sm mb-2">
                                            <HiOutlineCloudArrowUp className="w-5 h-5 mb-1"/> Upload E-Signature (PNG)
                                        </div> 
                                    ) : null}
                                </div>

                                <input readOnly={!isEditing} type="text" value={certData.sig1Name} onChange={(e) => handleChange('sig1Name', e.target.value)} className={`w-full font-bold text-xl text-center border-t-2 pt-2 bg-transparent focus:outline-none ${isEditing ? 'border-[#0094FF] hover:bg-blue-50/50' : 'border-black'}`} style={{ caretColor: '#000' }} />
                                <input readOnly={!isEditing} type="text" value={certData.sig1Role} onChange={(e) => handleChange('sig1Role', e.target.value)} className={`w-full text-base text-gray-600 font-medium italic text-center bg-transparent border-none focus:outline-none mt-1 ${isEditing ? 'hover:bg-blue-50/50 rounded' : ''}`} style={{ caretColor: '#666' }} />
                            </div>
                        </div>

                    </div>
                </div>
                <style>{`input[readonly] { color: black !important; -webkit-text-fill-color: black !important; cursor: default; } input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`}</style>
            </div>
        </div>
    );
};

export default EvaluationCertificate;
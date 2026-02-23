// fileName: EvaluationCertificate.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { HiOutlineArrowDownTray, HiOutlinePrinter, HiOutlineCloudArrowUp } from "react-icons/hi2";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import toast from "react-hot-toast";
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const EvaluationCertificate = ({ user, evaluation, intern }) => {
    const isSupervisor = user.role === 'supervisor';
    const [isIssued, setIsIssued] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Refs for hidden file inputs
    const leftLogoInputRef = useRef(null);
    const rightLogoInputRef = useRef(null);

    const [certData, setCertData] = useState({
        leftLogo: "", rightLogo: "", 
        schoolName: "YOUR UNIVERSITY NAME",
        schoolAddress: "123 University Avenue, City, Country",
        title: "CERTIFICATE OF COMPLETION", subTitle: "This certificate is proudly awarded to",
        studentName: '', bodyPart1: "For successfully completing the On-the-Job Training requirements",
        bodyPart2: "rendering a total of", hours: 0, bodyPart3: "hours out of", reqHours: 0, bodyPart4: "hours required.",
        dateLabel: "Given this", dateStr: '',
        sig1Name: '', 
        sig1Role: "Industry Supervisor"
    });

    useEffect(() => {
        if (evaluation?.certificateData) {
            setCertData(evaluation.certificateData);
            setIsIssued(evaluation.certificateIssued || false);
            setIsEditing(isSupervisor && !evaluation.certificateIssued);
        } else if (evaluation || intern) {
            const name = intern?.name || (intern?.firstName ? `${intern.firstName} ${intern.lastName}` : "") || evaluation?.internName || "STUDENT NAME";
            const h = intern?.totalHours || intern?.totalHoursCompleted || 0;
            const rh = intern?.requiredHours || 0;
            const d = evaluation?.submittedAt ? new Date(evaluation.submittedAt.toDate()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const supName = evaluation?.supervisorName || user?.name || "Supervisor Name";
            setCertData(prev => ({ ...prev, studentName: name, hours: h, reqHours: rh, dateStr: d, sig1Name: supName }));
            setIsIssued(false);
            setIsEditing(isSupervisor);
        }
    }, [evaluation, intern, user, isSupervisor]);

    const handleChange = (field, value) => { if (!isEditing) return; setCertData(prev => ({ ...prev, [field]: value })); };

    // --- UPDATED: FILE UPLOAD HANDLERS (Limit increased to 5MB) ---
    const handleLogoClick = (side) => {
        if (!isEditing) return;
        if (side === 'leftLogo' && leftLogoInputRef.current) leftLogoInputRef.current.click();
        if (side === 'rightLogo' && rightLogoInputRef.current) rightLogoInputRef.current.click();
    };

    const handleFileChange = (event, side) => {
        const file = event.target.files[0];
        if (!file) return;

        // SIZE CHECK: Increased to 5MB (5 * 1024 * 1024 bytes)
        if (file.size > 5242880) { 
            toast.error("Image too large. Please use a logo under 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            handleChange(side, reader.result);
            toast.success("Logo uploaded successfully!");
        };
        reader.readAsDataURL(file);
    };
    // ---------------------------------

    const saveCertificate = async (issueStatus) => {
        setIsSaving(true);
        try {
            const evalRef = doc(db, "evaluations", evaluation.id);
            await updateDoc(evalRef, { certificateData: certData, certificateIssued: issueStatus, certificateUpdatedAt: serverTimestamp() });
            setIsIssued(issueStatus); setIsEditing(!issueStatus);
            toast.success(issueStatus ? "Certificate Officially Issued!" : "Draft Saved Successfully");
        } catch (err) { console.error(err); toast.error("Failed to save certificate. Images might be too large."); } finally { setIsSaving(false); }
    };

    const handlePrint = () => {
        const input = document.getElementById("certificate-visual");
        if (!input) return toast.error("Certificate not found");
        const printWindow = window.open('', '', 'width=1200,height=800');
        if (!printWindow) return toast.error("Pop-up blocked.");
        const content = input.outerHTML;
        printWindow.document.write(`<html><head><title>Print Certificate</title><script src="https://cdn.tailwindcss.com"></script><style>@page { size: landscape; margin: 0; } body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; -webkit-print-color-adjust: exact; } .hide-on-export { display: none !important; } input { border: none !important; outline: none !important; background: transparent !important; }</style></head><body>${content}<script>setTimeout(() => { window.print(); window.close(); }, 800);</script></body></html>`);
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
            
            <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-[1123px] gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                    {isIssued ? (<span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-black tracking-wide uppercase flex items-center gap-2 shadow-sm">✅ Officially Issued</span>) : (<span className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-black tracking-wide uppercase flex items-center gap-2 shadow-sm">📝 Draft Mode (Not Sent)</span>)}
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
                    {isSupervisor && (
                        <>{isEditing ? (<>
                                {isIssued && <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg font-bold transition-colors">Cancel Edit</button>}
                                <button onClick={() => saveCertificate(false)} disabled={isSaving} className="px-4 py-2 text-sm border-2 border-[#0094FF] text-[#0094FF] hover:bg-blue-50 rounded-lg font-bold transition-colors disabled:opacity-50">Save Draft</button>
                                <button onClick={() => saveCertificate(true)} disabled={isSaving} className="px-5 py-2 text-sm bg-yellow-500 text-white hover:bg-yellow-600 rounded-lg font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 tracking-wide">⭐ ISSUE & SEND</button>
                        </>) : (<button onClick={() => setIsEditing(true)} className="px-5 py-2 text-sm bg-gray-900 text-white hover:bg-black rounded-lg font-bold transition-all shadow-md active:scale-95 tracking-wide">✏️ Edit Certificate</button>)}</>
                    )}
                    {(isIssued || isSupervisor) && (<>
                            <div className="w-px h-8 bg-gray-200 mx-2 hidden md:block"></div>
                            <button onClick={handlePDF} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 hover:text-[#0094FF] transition-colors text-sm font-bold shadow-sm"><HiOutlineArrowDownTray className="w-4 h-4" /> PDF</button>
                            <button onClick={handlePrint} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 hover:text-[#0094FF] transition-colors text-sm font-bold shadow-sm"><HiOutlinePrinter className="w-4 h-4" /> Print</button>
                    </>)}
                </div>
            </div>
            <div id="certificate-visual" className={`bg-white mx-auto text-black relative transition-shadow ${isEditing ? 'shadow-[0_0_30px_rgba(0,148,255,0.3)] ring-2 ring-[#0094FF]' : 'shadow-2xl'}`} style={{ width: '1123px', height: '794px', minWidth: '1123px', minHeight: '794px', overflow: 'hidden' }}> 
                <div className="w-full h-full border-[12px] border-[#002B66] p-2 box-border">
                    <div className="w-full h-full border-[3px] border-[#daa520] relative box-border flex flex-col justify-between pt-8 pb-8 px-12">
                        <div style={{ height: '150px', position: 'relative', width: '100%' }}>
                            <div className="absolute left-0 top-0 z-20 cursor-pointer" onClick={() => handleLogoClick('leftLogo')}>
                                {certData.leftLogo ? ( <img src={certData.leftLogo} alt="Left" className="h-28 w-28 object-contain" /> ) : isEditing ? ( <div className="border-2 border-dashed border-gray-300 rounded-full h-24 w-24 flex items-center justify-center text-xs text-gray-400 p-2 hide-on-export hover:bg-gray-50 transition-colors flex-col"><HiOutlineCloudArrowUp className="w-6 h-6"/>Upload Logo</div> ) : null}
                            </div>
                            <div className="absolute left-0 right-0 top-2 flex flex-col items-center justify-center z-10 mx-auto w-[600px]">
                                <input readOnly={!isEditing} type="text" value={certData.schoolName} onChange={(e) => handleChange('schoolName', e.target.value)} className={`w-full text-center text-3xl font-bold text-[#002B66] uppercase tracking-wide font-sans bg-transparent border-none focus:outline-none placeholder-[#002B66] ${isEditing ? 'hover:bg-blue-50/50 rounded' : ''}`} style={{ caretColor: '#002B66' }} />
                                <input readOnly={!isEditing} type="text" value={certData.schoolAddress} onChange={(e) => handleChange('schoolAddress', e.target.value)} className={`w-full text-center text-lg text-gray-600 mt-1 bg-transparent border-none focus:outline-none ${isEditing ? 'hover:bg-blue-50/50 rounded' : ''}`} style={{ caretColor: '#666' }} />
                            </div>
                            <div className="absolute right-0 top-0 z-20 cursor-pointer" onClick={() => handleLogoClick('rightLogo')}>
                                {certData.rightLogo ? ( <img src={certData.rightLogo} alt="Right" className="h-28 w-28 object-contain" /> ) : isEditing ? ( <div className="border-2 border-dashed border-gray-300 rounded-full h-24 w-24 flex items-center justify-center text-xs text-gray-400 p-2 hide-on-export hover:bg-gray-50 transition-colors flex-col"><HiOutlineCloudArrowUp className="w-6 h-6"/>Upload Logo</div> ) : null}
                            </div>
                            <div className="absolute bottom-0 left-10 right-10 border-b border-gray-200"></div>
                        </div>
                        <div style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <input readOnly={!isEditing} type="text" value={certData.title} onChange={(e) => handleChange('title', e.target.value)} className={`w-full text-center text-5xl font-bold text-[#002B66] uppercase tracking-[0.2em] font-sans bg-transparent border-none focus:outline-none ${isEditing ? 'hover:bg-blue-50/50 rounded' : ''}`} style={{ caretColor: '#002B66' }} />
                            <input readOnly={!isEditing} type="text" value={certData.subTitle} onChange={(e) => handleChange('subTitle', e.target.value)} className={`w-full text-center text-xl italic text-gray-600 mt-1 bg-transparent border-none focus:outline-none ${isEditing ? 'hover:bg-blue-50/50 rounded' : ''}`} style={{ caretColor: '#666' }} />
                        </div>
                        <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <input readOnly={!isEditing} type="text" value={certData.studentName} onChange={(e) => handleChange('studentName', e.target.value)} className={`w-[90%] text-center text-[4rem] leading-none font-bold text-black border-b border-gray-300 pb-2 bg-transparent focus:outline-none uppercase font-[serif] ${isEditing ? 'hover:bg-blue-50/50 border-blue-300' : ''}`} style={{ caretColor: '#000' }} />
                        </div>
                        <div style={{ height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'start', paddingTop: '10px' }}>
                            <input readOnly={!isEditing} type="text" value={certData.bodyPart1} onChange={(e) => handleChange('bodyPart1', e.target.value)} className={`w-full text-center bg-transparent border-none focus:outline-none text-xl text-gray-800 ${isEditing ? 'hover:bg-blue-50/50 rounded' : ''}`} style={{ caretColor: '#444' }} />
                            <div className="flex justify-center items-baseline gap-2 mt-4 text-xl text-gray-800 w-full flex-wrap">
                                <span className="whitespace-nowrap">rendering a total of</span>
                                <input readOnly={!isEditing} type="number" value={certData.hours} onChange={(e) => handleChange('hours', e.target.value)} className={`font-bold text-center w-20 border-b-2 bg-transparent focus:outline-none text-2xl px-1 ${isEditing ? 'border-[#0094FF] bg-blue-50' : 'border-black'}`} style={{ caretColor: '#000', MozAppearance: 'textfield', WebkitAppearance: 'none' }} />
                                <span className="whitespace-nowrap">hours out of</span>
                                <input readOnly={!isEditing} type="number" value={certData.reqHours} onChange={(e) => handleChange('reqHours', e.target.value)} className={`font-bold text-center w-20 border-b-2 bg-transparent focus:outline-none text-2xl px-1 ${isEditing ? 'border-[#0094FF] bg-blue-50' : 'border-black'}`} style={{ caretColor: '#000', MozAppearance: 'textfield', WebkitAppearance: 'none' }} />
                                <span className="whitespace-nowrap">hours required.</span>
                            </div>
                            <div className="flex justify-center items-baseline gap-2 mt-4 text-xl text-gray-800">
                                <span>Given this</span>
                                <input readOnly={!isEditing} type="text" value={certData.dateStr} onChange={(e) => handleChange('dateStr', e.target.value)} className={`font-bold text-center w-72 border-b-2 bg-transparent focus:outline-none text-xl px-2 ${isEditing ? 'border-[#0094FF] bg-blue-50' : 'border-black'}`} style={{ caretColor: '#000' }} />
                                <span>.</span>
                            </div>
                        </div>
                        
                        {/* --- UPDATED: SINGLE CENTERED SIGNATURE --- */}
                        <div style={{ height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'end' }}>
                            <div className="text-center flex flex-col items-center w-80">
                                <input readOnly={!isEditing} type="text" value={certData.sig1Name} onChange={(e) => handleChange('sig1Name', e.target.value)} className={`w-full font-bold text-xl text-center border-t-2 pt-2 bg-transparent focus:outline-none ${isEditing ? 'border-[#0094FF] hover:bg-blue-50/50' : 'border-black'}`} style={{ caretColor: '#000' }} />
                                <input readOnly={!isEditing} type="text" value={certData.sig1Role} onChange={(e) => handleChange('sig1Role', e.target.value)} className={`w-full text-sm text-gray-500 italic text-center bg-transparent border-none focus:outline-none ${isEditing ? 'hover:bg-blue-50/50 rounded' : ''}`} style={{ caretColor: '#666' }} />
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
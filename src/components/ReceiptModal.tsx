import React, { useEffect, useState, useRef } from 'react';
import { Download, CheckCircle2, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface ReceiptSetting {
  id: number;
  org_name: string;
  org_subtitle: string;
  org_association: string;
  receipt_prefix: string;
  default_purpose: string;
  signature_title: string;
  logo_url: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  contribution: {
    id: number;
    amount: number;
    date: string;
    payment_method: string;
    collected_by?: string | null;
    donor_name?: string;
    donor_phone?: string;
    contributor?: {
      name: string;
      phone: string | null;
    };
  } | null;
}

const englishToTelugu = (text: string): string => {
  if (!text) return '';
  // Check if already contains Telugu unicode block (0C00-0C7F)
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return text;
  }

  const clean = text.toLowerCase().trim();
  
  // Transliteration dictionary for custom names/cities
  const dict: Record<string, string> = {
    'surya': 'సూర్య',
    'surya teja': 'సూర్య తేజ',
    'suryateja': 'సూర్య తేజ',
    'razole': 'రాజోలు',
    'aditya': 'ఆదిత్య',
    'narendra': 'నరేంద్ర',
    'hemaraj': 'హేమరాజ్',
    'hema raj': 'హేమరాజ్',
    'bheemesh': 'భీమేష్',
    'bhimeesh': 'భీమేష్',
    'ram ganesh': 'రామ్ గణేష్',
    'ramganesh': 'రామ్ గణేష్',
    'ganesh': 'గణేష్',
    'prakash': 'ప్రకాష్',
    'loku tn': 'లోకేష్',
    'lokesh': 'లోకేష్',
    'vijay': 'విజయ్',
    'kalyan': 'కళ్యాణ్',
    'sandeep': 'సందీప్',
    'ramesh': 'రమేష్',
    'kumar': 'కుమార్',
    'naveen': 'నవీన్',
    'aditya annaya': 'ఆదిత్య అన్నయ్య',
    'lokesh annaya': 'లోకేష్ అన్నయ్య',
    'satya': 'సత్య',
    'satyanaarayana': 'సత్యనారాయణ',
    'satyababu': 'సత్యబాబు'
  };

  if (dict[clean]) return dict[clean];

  // Word-by-word fallback matching
  const words = clean.split(/\s+/);
  const translatedWords = words.map(w => {
    if (dict[w]) return dict[w];
    return w.charAt(0).toUpperCase() + w.slice(1); // Keep as capitalized English if not found
  });

  return translatedWords.join(' ');
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, contribution }) => {
  const { token } = useAuth();
  const [settings, setSettings] = useState<ReceiptSetting | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [sharingImage, setSharingImage] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    if (isOpen && token) {
      // Fetch dynamic receipt settings from API
      fetch(`${API_BASE_URL}/api/finance/receipt-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setSettings(data))
        .catch(err => console.error('Error fetching receipt settings:', err));
    }
  }, [isOpen, token]);

  if (!isOpen || !contribution) return null;

  // Map values robustly from either Chandha or Contribution shape
  const id = contribution.id;
  const amount = Number(contribution.amount);
  const date = contribution.date;
  const paymentMethod = contribution.payment_method;
  const collectedBy = contribution.collected_by || 'N/A';

  // Get raw values for PDF rendering (high compatibility) and translated for UI/WhatsApp
  const rawName = contribution.donor_name || contribution.contributor?.name || 'Anonymous';
  const rawTown = contribution.donor_phone ? (contribution as any).notes || 'Razole' : 'Razole';

  const name = englishToTelugu(rawName);
  const town = englishToTelugu(rawTown);


  // Organization branding fallback values
  const orgName = settings?.org_name || 'వినాయక చవితి';
  const orgSubtitle = settings?.org_subtitle || 'నవరాత్రుల మహోత్సవములు';
  const orgAssociation = settings?.org_association || 'శ్రీ బాల బాలాజీ యువజన సంఘం';
  const receiptPrefix = settings?.receipt_prefix || 'TG-CH';
  const defaultPurpose = settings?.default_purpose || 'Ganapathi Utsav Contributions';
  const signatureTitle = settings?.signature_title || 'Signature of Authorized Person';
  const logoUrl = settings?.logo_url || '/logo.png';

  // Helper to convert number to English Words
  const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = Math.floor(num)) === 0) return 'Zero';
    
    const translate = (n: number): string => {
      let word = '';
      if (n >= 100) {
        word += a[Math.floor(n / 100)] + 'Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        word += b[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        word += a[n];
      }
      return word;
    };

    let result = '';
    if (num >= 100000) {
      result += translate(Math.floor(num / 100000)) + 'Lakh ';
      num %= 100000;
    }
    if (num >= 1000) {
      result += translate(Math.floor(num / 1000)) + 'Thousand ';
      num %= 1000;
    }
    result += translate(num);
    return result.trim() + ' Rupees Only';
  };

  const amountInWords = numberToWords(amount);

  // Generate and Share actual visual Receipt Image via Web Share API or download & WhatsApp
  const handleShareImage = async () => {
    if (!receiptRef.current) return;
    setSharingImage(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAF7F2'
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setSharingImage(false);
          return;
        }

        const fileName = `Receipt_${receiptPrefix}_${id}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        // If mobile / browser Web Share API supports file sharing, open WhatsApp directly with the image!
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${orgName} - Official Receipt`,
              text: `🚩 *${orgName}* - Official Receipt #${receiptPrefix}-${id} for ₹${amount.toLocaleString('en-IN')}/-`
            });
            setSharingImage(false);
            return;
          } catch (shareErr) {
            console.log('Native share canceled or fallback needed:', shareErr);
          }
        }

        // Desktop Fallback: Download the high-res PNG image and open WhatsApp
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        handleShareWhatsApp();
        setSharingImage(false);
      }, 'image/png');
    } catch (err) {
      console.error('Error generating image:', err);
      setSharingImage(false);
    }
  };

  // Generate and Share via WhatsApp Click-to-Chat (Text version)
  const handleShareWhatsApp = () => {
    const message = `🚩 *${orgName.toUpperCase()} ${orgSubtitle.toUpperCase()}* 🚩\n` +
      `*${orgAssociation}*\n\n` +
      `*OFFICIAL DONATION RECEIPT*\n` +
      `---------------------------------------\n` +
      `*Receipt No:* #${receiptPrefix}-${id}\n` +
      `*Date:* ${date}\n` +
      `*Received with thanks from:* ${name}\n` +
      `*Town / Village:* ${town}\n` +
      `*Sum of Rupees:* ${amountInWords}\n` +
      `*Donation Amount:* ₹${amount.toLocaleString('en-IN')}/-\n` +
      `*Payment Mode:* ${paymentMethod}\n` +
      `*Collected By:* ${collectedBy}\n` +
      `---------------------------------------\n` +
      `Thank you for your generous contribution! Your support is highly appreciated. 🙏\n\n` +
      `_This is a digitally generated official receipt._`;

    // By not specifying a phone number, WhatsApp opens a contact and group picker,
    // allowing the user to select one or multiple contacts/groups.
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(shareUrl, '_blank');
  };

  // Generate and Download PDF using jsPDF (A5 Portrait style)
  const handleDownloadPDF = () => {
    setPdfGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5' // A5 is perfect for printable receipts
      });

      const pgW = 148;
      const pgH = 210;

      // Draw red/pink outer double borders
      doc.setDrawColor(196, 30, 58); // Maroon
      doc.setLineWidth(1.2);
      doc.rect(5, 5, pgW - 10, pgH - 10);

      doc.setDrawColor(201, 154, 74); // Gold
      doc.setLineWidth(0.4);
      doc.rect(6.5, 6.5, pgW - 13, pgH - 13);

      // Pink header block
      doc.setFillColor(196, 30, 58);
      doc.rect(7, 7, pgW - 14, 34, 'F');

      // Green banner block under header
      doc.setFillColor(0, 90, 54);
      doc.rect(7, 41, pgW - 14, 8, 'F');

      // Draw vertical gold border lines on the right side to match mockup
      doc.setDrawColor(201, 154, 74);
      doc.setLineWidth(1.5);
      doc.line(pgW - 10, 7, pgW - 10, pgH - 7);

      // Load Logo
      const img = new Image();
      img.src = logoUrl;
      img.onload = () => {
        try {
          doc.addImage(img, 'PNG', 12, 11, 24, 24);
        } catch (e) {
          console.error("Failed to add image to PDF", e);
        }
        continueGeneratingPDF();
      };
      img.onerror = () => {
        continueGeneratingPDF();
      };

      const continueGeneratingPDF = () => {
        // Render Header Texts (English fallback if Telugu fails, but standard fonts will render basic text.
        // We will output clean bilingual text where possible)
        doc.setTextColor(255, 255, 255);
        doc.setFont('times', 'bold');
        doc.setFontSize(20);
        doc.text(orgName, pgW / 2 + 10, 18, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('times', 'italic');
        doc.text(orgSubtitle, pgW / 2 + 10, 26, { align: 'center' });

        // Yellow text on green banner
        doc.setTextColor(244, 196, 48); // Gold Yellow
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(orgAssociation, pgW / 2, 46.5, { align: 'center' });

        // Body Labels in English (Standard High-Compatibility Layout)
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.text(`Receipt No: #${receiptPrefix}-${id}`, 15, 62);
        doc.text(`Date: ${date}`, pgW - 18, 62, { align: 'right' });

        // Details lines
        const drawFieldLine = (label: string, value: string, y: number) => {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(80, 80, 80);
          doc.text(label, 15, y);

          doc.setFont('times', 'italic');
          doc.setFontSize(11);
          doc.setTextColor(30, 41, 99); // Navy blue for value
          doc.text(value, 58, y);

          // Divider dots
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          doc.line(58, y + 1.5, pgW - 18, y + 1.5);
          doc.setFontSize(9.5);
        };

        drawFieldLine('Received with thanks from:', rawName, 76);
        drawFieldLine('Town / Village:', rawTown, 88);
        drawFieldLine('Sum of Rupees:', amountInWords, 100);
        drawFieldLine('On account of:', defaultPurpose, 112);
        drawFieldLine('Payment Mode:', paymentMethod, 124);

        // Large bold Amount Box
        doc.setFillColor(250, 247, 242);
        doc.setDrawColor(201, 154, 74);
        doc.setLineWidth(0.5);
        doc.roundedRect(15, 136, pgW - 30, 14, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(196, 30, 58); // Maroon
        doc.text(`Donation Amount:   Rs. ${amount.toLocaleString('en-IN')}/-`, pgW / 2, 145, { align: 'center' });

        // Verified Circle Stamp
        doc.setDrawColor(196, 30, 58);
        doc.setLineWidth(0.5);
        doc.circle(40, 172, 12);
        
        doc.setFont('times', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(196, 30, 58);
        doc.text('TEAM GARUDA', 40, 169.5, { align: 'center' });
        doc.setFontSize(6.5);
        doc.text('VERIFIED', 40, 173, { align: 'center' });
        doc.setFontSize(5);
        doc.text('OFFICIAL RECORD', 40, 176, { align: 'center' });

        // Signature lines
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(signatureTitle, pgW - 18, 180, { align: 'right' });
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        doc.line(pgW - 60, 176, pgW - 18, 176);

        // Save PDF
        doc.save(`Receipt_${receiptPrefix}_${id}.pdf`);
        setPdfGenerating(false);
      };
    } catch (e) {
      console.error('Error generating PDF:', e);
      alert('Failed to generate PDF receipt.');
      setPdfGenerating(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Receipt Preview"
    >
      <div className="flex flex-col gap-5 select-text pb-4">
        
        {/* Visual Receipt Card layout matching the custom Telugu mockup */}
        <div ref={receiptRef} className="w-full bg-[#FAF7F2] border border-[#C99A4A] rounded-2xl overflow-hidden shadow-md flex flex-col relative select-text">
          
          {/* Filigree right border graphic */}
          <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-gradient-to-b from-[#C99A4A]/40 to-[#C99A4A]/20 border-l border-[#C99A4A]/30 flex flex-col items-center justify-around py-2 shrink-0">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-[#C99A4A]" />
            ))}
          </div>

          {/* Pink Header Block */}
          <div className="bg-[#C41E3A] px-4 py-3 flex items-center gap-3 border-b border-[#C99A4A] pr-6">
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-12 h-12 rounded-full border border-white/20 bg-white/10 object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div className="flex-1 min-w-0 text-left">
              <h1 className="text-sm font-black text-white leading-tight font-serif tracking-wide block truncate">
                {orgName}
              </h1>
              <p className="text-[10px] text-white/90 italic font-serif leading-none mt-0.5 block truncate">
                {orgSubtitle}
              </p>
            </div>
          </div>

          {/* Green Association Banner */}
          <div className="bg-[#005A36] px-4 py-1.5 border-b border-[#C99A4A]/40 text-center pr-6">
            <h2 className="text-[10px] font-black text-[#FFD700] tracking-wider font-serif">
              {orgAssociation}
            </h2>
          </div>

          {/* Receipt Body fields (English Labels, Telugu handwritten values) */}
          <div className="p-4 flex flex-col gap-3 pr-6 text-left">
            
            <div className="flex justify-between items-center text-[10px] text-secondary-text font-bold uppercase tracking-wider">
              <span>Receipt No: <span className="font-mono text-primary-text text-xs">#{receiptPrefix}-{id}</span></span>
              <span>Date: <span className="font-mono text-primary-text text-xs">{date}</span></span>
            </div>

            <hr className="border-border-custom/50" />

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-secondary-text font-extrabold uppercase tracking-widest">Received with thanks from:</span>
                <span className="font-serif italic font-extrabold text-blue-900 text-sm tracking-wide bg-blue-50/40 px-2 py-1.5 rounded-lg border border-blue-900/10">
                  {name}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-secondary-text font-extrabold uppercase tracking-widest">Town / Village:</span>
                <span className="font-serif italic font-bold text-blue-900 text-xs tracking-wide bg-blue-50/40 px-2 py-1.5 rounded-lg border border-blue-900/10">
                  {town}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-secondary-text font-extrabold uppercase tracking-widest">Sum of Rupees:</span>
                <span className="text-[10px] font-semibold text-primary-text leading-tight bg-white px-2 py-1.5 rounded-lg border border-border-custom/60">
                  {amountInWords}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 mt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-secondary-text font-extrabold uppercase tracking-widest">Payment Mode:</span>
                  <span className="font-mono text-[9px] font-black uppercase bg-[#FAF7F2] border border-border-custom px-2 py-1 rounded w-fit text-primary-text">
                    {paymentMethod}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-secondary-text font-extrabold uppercase tracking-widest">Collected By:</span>
                  <span className="text-[10px] font-bold text-primary-text truncate">
                    {collectedBy}
                  </span>
                </div>
              </div>
            </div>

            {/* Figures Amount Box */}
            <div className="bg-[#FAF7F2] border border-[#C99A4A] rounded-xl p-3 flex items-center justify-between mt-2.5 shadow-xs">
              <span className="text-[9px] font-black text-secondary-text uppercase tracking-widest">Amount:</span>
              <span className="text-sm font-black text-[#C41E3A] font-mono">
                ₹{amount.toLocaleString('en-IN')}/-
              </span>
            </div>

            {/* Stamp and signature placeholders */}
            <div className="flex items-center justify-between mt-3">
              {/* Seal stamp */}
              <div className="w-16 h-16 rounded-full border border-dashed border-[#C41E3A]/40 flex flex-col items-center justify-center text-[#C41E3A] font-serif rotate-[-12deg] select-none shrink-0 opacity-80">
                <span className="text-[5px] font-black tracking-widest">TEAM GARUDA</span>
                <CheckCircle2 className="w-3.5 h-3.5 my-0.5" />
                <span className="text-[5px] font-bold uppercase tracking-wider">VERIFIED</span>
              </div>

              {/* Signature label */}
              <div className="flex flex-col items-end">
                <div className="w-24 border-b border-secondary-text/30 h-6 shrink-0" />
                <span className="text-[8px] text-secondary-text font-extrabold mt-1 text-right max-w-[120px] leading-tight">
                  {signatureTitle}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 shrink-0">
          {/* Primary Button: Share Image (Native share on mobile or PNG download + WhatsApp on desktop) */}
          <button
            onClick={handleShareImage}
            disabled={sharingImage}
            className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-60"
          >
            {sharingImage ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
            <span>{sharingImage ? 'Preparing Receipt Image...' : 'Share Receipt Image (WhatsApp / Groups)'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Share Formatted Text */}
            <button
              onClick={handleShareWhatsApp}
              className="bg-white border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/5 py-3 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Share Text Only</span>
            </button>
            
            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={pdfGenerating}
              className="bg-primary-maroon hover:bg-dark-maroon text-white py-3 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm disabled:opacity-55 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{pdfGenerating ? 'Generating...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </BottomSheet>
  );
};

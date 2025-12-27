import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Printer } from 'lucide-react';
import { format } from 'date-fns';

interface CertificateTemplate {
  id: string;
  name: string;
  header_text: string;
  body_template: string;
  footer_text: string | null;
}

interface Certificate {
  id: string;
  certificate_number: string;
  issued_date: string;
  achievement_text: string | null;
  status: string;
}

interface ViewCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: Certificate | null;
  template: CertificateTemplate | null;
  studentName: string;
  className: string;
  academicYear?: string;
}

export function ViewCertificateDialog({
  open,
  onOpenChange,
  certificate,
  template,
  studentName,
  className,
  academicYear = new Date().getFullYear().toString(),
}: ViewCertificateDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!certificate || !template) return null;

  const processTemplate = (text: string) => {
    return text
      .replace(/\{\{student_name\}\}/g, studentName)
      .replace(/\{\{class_name\}\}/g, className)
      .replace(/\{\{achievement\}\}/g, certificate.achievement_text || '')
      .replace(/\{\{academic_year\}\}/g, academicYear)
      .replace(/\{\{date\}\}/g, format(new Date(certificate.issued_date), 'MMMM d, yyyy'));
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${certificate.certificate_number}</title>
          <style>
            @page { size: landscape; margin: 0.5in; }
            body { 
              font-family: 'Georgia', serif; 
              margin: 0; 
              padding: 40px;
              background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
            }
            .certificate {
              border: 8px double #1a365d;
              padding: 60px;
              text-align: center;
              background: white;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header { 
              font-size: 36px; 
              font-weight: bold; 
              color: #1a365d; 
              margin-bottom: 20px;
              text-transform: uppercase;
              letter-spacing: 3px;
            }
            .body { 
              font-size: 18px; 
              line-height: 1.8; 
              margin: 40px 0;
              color: #333;
            }
            .footer { 
              font-size: 14px; 
              color: #666; 
              font-style: italic;
              margin-top: 30px;
            }
            .cert-number {
              font-size: 12px;
              color: #999;
              margin-top: 40px;
            }
            .date {
              font-size: 14px;
              margin-top: 20px;
              color: #555;
            }
            .signature-line {
              margin-top: 60px;
              display: flex;
              justify-content: space-around;
            }
            .signature {
              text-align: center;
            }
            .signature-line-inner {
              border-top: 1px solid #333;
              width: 200px;
              margin: 0 auto;
            }
            .signature-label {
              font-size: 12px;
              margin-top: 8px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">${template.header_text}</div>
            <div class="body">${processTemplate(template.body_template)}</div>
            ${template.footer_text ? `<div class="footer">${template.footer_text}</div>` : ''}
            <div class="date">Issued on ${format(new Date(certificate.issued_date), 'MMMM d, yyyy')}</div>
            <div class="signature-line">
              <div class="signature">
                <div class="signature-line-inner"></div>
                <div class="signature-label">Class Teacher</div>
              </div>
              <div class="signature">
                <div class="signature-line-inner"></div>
                <div class="signature-label">Principal</div>
              </div>
            </div>
            <div class="cert-number">Certificate No: ${certificate.certificate_number}</div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Certificate Preview</DialogTitle>
        </DialogHeader>

        <div
          ref={printRef}
          className="border-4 border-double border-primary/30 p-8 text-center bg-gradient-to-br from-background to-muted/30 rounded-lg"
        >
          <h1 className="text-2xl font-bold text-primary tracking-widest uppercase mb-4">
            {template.header_text}
          </h1>

          <Separator className="my-4" />

          <p className="text-lg leading-relaxed my-6">
            {processTemplate(template.body_template)}
          </p>

          {template.footer_text && (
            <p className="text-sm text-muted-foreground italic mt-4">
              {template.footer_text}
            </p>
          )}

          <p className="text-sm mt-6">
            Issued on {format(new Date(certificate.issued_date), 'MMMM d, yyyy')}
          </p>

          <div className="flex justify-around mt-10">
            <div className="text-center">
              <div className="border-t border-foreground/30 w-40 mx-auto" />
              <p className="text-xs mt-2 text-muted-foreground">Class Teacher</p>
            </div>
            <div className="text-center">
              <div className="border-t border-foreground/30 w-40 mx-auto" />
              <p className="text-xs mt-2 text-muted-foreground">Principal</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-8">
            Certificate No: {certificate.certificate_number}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

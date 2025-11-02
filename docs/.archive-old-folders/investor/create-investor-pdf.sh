#!/bin/bash

echo "📄 XAHEEN INVESTOR PITCH - PDF CONVERSION GUIDE"
echo "================================================"
echo ""

# Check if pandoc is installed
if command -v pandoc &> /dev/null; then
    echo "✅ Pandoc is installed!"
    echo ""
    echo "Converting to PDF..."

    pandoc INVESTOR_PITCH_FINAL.md \
        -o XAHEEN_INVESTOR_PITCH.pdf \
        --pdf-engine=pdflatex \
        -V geometry:margin=1in \
        -V fontsize=11pt \
        -V colorlinks=true \
        --toc \
        --toc-depth=2

    if [ -f "XAHEEN_INVESTOR_PITCH.pdf" ]; then
        echo "✅ PDF created successfully!"
        echo "📍 Location: XAHEEN_INVESTOR_PITCH.pdf"
        echo ""
        open XAHEEN_INVESTOR_PITCH.pdf 2>/dev/null || echo "Open the file manually to view"
    else
        echo "❌ PDF creation failed"
    fi
else
    echo "❌ Pandoc not installed"
    echo ""
    echo "📋 INSTALLATION OPTIONS:"
    echo ""
    echo "Option 1: Install Pandoc (Mac)"
    echo "   brew install pandoc"
    echo "   brew install basictex  # For PDF support"
    echo ""
    echo "Option 2: Use Online Converter"
    echo "   1. Go to: https://www.markdowntopdf.com/"
    echo "   2. Upload: INVESTOR_PITCH_FINAL.md"
    echo "   3. Download PDF"
    echo ""
    echo "Option 3: Use Google Docs"
    echo "   1. Open: https://docs.google.com"
    echo "   2. File → Open → Upload INVESTOR_PITCH_FINAL.md"
    echo "   3. File → Download → PDF"
    echo ""
    echo "Option 4: Use MacDown (Mac App)"
    echo "   1. Download: https://macdown.uranusjr.com/"
    echo "   2. Open INVESTOR_PITCH_FINAL.md"
    echo "   3. File → Export → PDF"
    echo ""
    echo "Option 5: Use VSCode"
    echo "   1. Install 'Markdown PDF' extension"
    echo "   2. Open INVESTOR_PITCH_FINAL.md"
    echo "   3. Right-click → Markdown PDF: Export (pdf)"
    echo ""
fi

echo ""
echo "💡 RECOMMENDED FOR BEST RESULTS:"
echo "   Use PowerPoint/Keynote to create a proper slide deck"
echo "   This markdown is the CONTENT - format it nicely for presentation"
echo ""
echo "🎨 DESIGN TIPS:"
echo "   - Use your brand colors"
echo "   - Add charts and graphs"
echo "   - Include screenshots of working blockchain"
echo "   - Professional fonts (not default)"
echo "   - Consistent spacing and layout"
echo ""

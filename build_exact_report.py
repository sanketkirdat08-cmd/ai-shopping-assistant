import os
from PIL import Image
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def sanitize_img(img_path):
    if not os.path.exists(img_path):
        return None
    try:
        clean_path = img_path.rsplit('.', 1)[0] + '_dpi96.png'
        if not os.path.exists(clean_path):
            im = Image.open(img_path)
            im.save(clean_path, format='PNG', dpi=(96, 96))
        return clean_path
    except Exception as e:
        print(f"Error sanitizing {img_path}: {e}")
        return img_path

def add_page_border(section):
    sectPr = section._sectPr
    pgBorders = OxmlElement('w:pgBorders')
    pgBorders.set(qn('w:offsetFrom'), 'page')
    for b in ('top', 'left', 'bottom', 'right'):
        node = OxmlElement(f'w:{b}')
        node.set(qn('w:val'), 'single')
        node.set(qn('w:sz'), '6')      # 0.75 pt border
        node.set(qn('w:space'), '18')   # 18pt space
        node.set(qn('w:color'), '222222')
        pgBorders.append(node)
    sectPr.append(pgBorders)

def set_table_borders(table, color="333333", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    tblBorders = OxmlElement('w:tblBorders')
    for border_name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        border = OxmlElement(f'w:{border_name}')
        border.set(qn('w:val'), val)
        border.set(qn('w:sz'), sz)
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), color)
        tblBorders.append(border)
    tblPr.append(tblBorders)

def set_cell_margins(cell, top=60, bottom=60, left=80, right=80):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def build_report():
    doc = Document()
    
    # Page setup - 0.6 inch margins to allow page border & match original
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11.0)
    section.top_margin = Inches(0.55)
    section.bottom_margin = Inches(0.55)
    section.left_margin = Inches(0.7)
    section.right_margin = Inches(0.7)
    
    # Add page border
    add_page_border(section)
    
    # Header
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    hrun = hp.add_run("ARVIND GAVALI COLLEGE OF ENGG.,SATARA")
    hrun.font.name = "Times New Roman"
    hrun.font.size = Pt(9.5)
    hrun.font.bold = True
    hrun.font.color.rgb = RGBColor(30, 30, 30)
    
    # Footer
    footer = section.footer
    p_num = footer.paragraphs[0]
    p_num.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_num.paragraph_format.space_before = Pt(0)
    p_num.paragraph_format.space_after = Pt(3)
    fld = OxmlElement('w:fldSimple')
    fld.set(qn('w:instr'), 'PAGE')
    p_num._p.append(fld)
    
    fp = footer.add_paragraph()
    fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
    fp.paragraph_format.space_before = Pt(0)
    fp.paragraph_format.space_after = Pt(0)
    frun = fp.add_run("TRAINING REPORT")
    frun.font.name = "Times New Roman"
    frun.font.size = Pt(9.5)
    frun.font.bold = True
    frun.font.color.rgb = RGBColor(30, 30, 30)

    # Content helpers
    def add_page_header_number(pno):
        pass

    def add_chapter_title(title_text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(12)
        run = p.add_run(title_text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = RGBColor(180, 20, 20)
        return p

    def add_subheading(sub_text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(5)
        run = p.add_run(sub_text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(11.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(15, 15, 15)
        return p

    def add_body(text, bold_prefix=""):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            br = p.add_run(bold_prefix)
            br.font.name = "Times New Roman"
            br.font.size = Pt(10.5)
            br.font.bold = True
        run = p.add_run(text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(30, 30, 30)
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2.5)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            br = p.add_run(bold_prefix)
            br.font.name = "Times New Roman"
            br.font.size = Pt(10)
            br.font.bold = True
        run = p.add_run(text)
        run.font.name = "Times New Roman"
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(30, 30, 30)
        return p

    def add_img(img_path, width_in=4.8, caption=""):
        safe_path = sanitize_img(img_path)
        if safe_path and os.path.exists(safe_path):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(3)
            p.add_run().add_picture(safe_path, width=Inches(width_in))
            if caption:
                cp = doc.add_paragraph()
                cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
                cp.paragraph_format.space_after = Pt(6)
                crun = cp.add_run(caption)
                crun.font.name = "Times New Roman"
                crun.font.size = Pt(9)
                crun.font.italic = True
                crun.font.color.rgb = RGBColor(90, 90, 90)

    # ==========================================
    # PAGE 1: TITLE / COVER PAGE
    # ==========================================
    add_page_header_number(1)
    add_img('extracted_images/p1_img1_11.jpeg', width_in=1.6)
    
    p_col = doc.add_paragraph()
    p_col.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_col.paragraph_format.space_before = Pt(6)
    r = p_col.add_run("ARVIND GAVALI COLLEGE\nOF ENGINEERING, SATARA.")
    r.font.name = "Times New Roman"
    r.font.size = Pt(15)
    r.font.bold = True
    r.font.color.rgb = RGBColor(180, 20, 20)
    
    p_rep = doc.add_paragraph()
    p_rep.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_rep.paragraph_format.space_before = Pt(16)
    r = p_rep.add_run("A\nIndustrial Training Report\n\nOn\n")
    r.font.name = "Times New Roman"
    r.font.size = Pt(12)
    r.font.bold = True
    
    r_topic = p_rep.add_run('"Artificial Intelligence & Web Application Development"\n(Using Visual Studio Code, React.js & Google Gemini AI)')
    r_topic.font.name = "Times New Roman"
    r_topic.font.size = Pt(14)
    r_topic.font.bold = True
    r_topic.font.color.rgb = RGBColor(15, 30, 80)
    
    p_by = doc.add_paragraph()
    p_by.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_by.paragraph_format.space_before = Pt(20)
    r = p_by.add_run("Presented by\n")
    r.font.size = Pt(11)
    r_name = p_by.add_run("Sharvari Prashant Pawar\n")
    r_name.font.size = Pt(14)
    r_name.font.bold = True
    r_name.font.color.rgb = RGBColor(180, 20, 20)
    
    p_at = doc.add_paragraph()
    p_at.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_at.paragraph_format.space_before = Pt(14)
    r = p_at.add_run("At\nIndradeep Information Technology Pvt. Ltd.\n\n")
    r.font.size = Pt(11)
    r_dip = p_at.add_run("Diploma in Computer Engineering\n\n")
    r_dip.font.size = Pt(12.5)
    r_dip.font.bold = True
    r_dip.font.color.rgb = RGBColor(180, 20, 20)
    
    p_guide = doc.add_paragraph()
    p_guide.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_guide.paragraph_format.space_before = Pt(12)
    r = p_guide.add_run("Guided by\nMr. Vaibhav Limbkar")
    r.font.size = Pt(11.5)
    r.font.bold = True

    doc.add_page_break()

    # ==========================================
    # PAGE 2: CERTIFICATE OF COMPLETION
    # ==========================================
    add_page_header_number(2)
    p_msbte = doc.add_paragraph()
    p_msbte.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_msbte.add_run("MAHARASHTRA STATE BOARD OF\nTECHNICAL EDUCATION\n")
    r.font.size = Pt(12.5)
    r.font.bold = True
    
    table_logos = doc.add_table(rows=1, cols=2)
    table_logos.alignment = WD_TABLE_ALIGNMENT.CENTER
    c1, c2 = table_logos.rows[0].cells
    c1.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    c2.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1 = sanitize_img('extracted_images/p2_img2_15.jpeg')
    p2 = sanitize_img('extracted_images/p2_img1_14.jpeg')
    if p1: c1.paragraphs[0].add_run().add_picture(p1, width=Inches(1.1))
    if p2: c2.paragraphs[0].add_run().add_picture(p2, width=Inches(1.0))

    p_col2 = doc.add_paragraph()
    p_col2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_col2.paragraph_format.space_before = Pt(8)
    r = p_col2.add_run("ARVIND GAVALI COLLEGE\nOF ENGINEERING ,SATARA\n\n")
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(180, 20, 20)
    
    r_cert = p_col2.add_run("CERTIFICATE OF COMPLETION\nOf Industrial Training\n(By respective Head of the Institute & Head of the Department)\n")
    r_cert.font.size = Pt(11.5)
    r_cert.font.bold = True
    
    p_cert_body = doc.add_paragraph()
    p_cert_body.paragraph_format.space_before = Pt(12)
    p_cert_body.paragraph_format.line_spacing = 1.3
    p_cert_body.paragraph_format.space_after = Pt(20)
    r = p_cert_body.add_run(
        "This is to certify that Ms . Sharvari Prashant Pawar. with Enrollment No. 24212080098 has successfully completed Industrial Training (22057) in Indradeep Information Technology Pvt. Ltd. From 01/06/26 to 21/08/26 for partial Fulfilment towords completion of diploma in Computer Engineering from Arvind Gavali College of Engineering.\n\nInstitute Code: 1617"
    )
    r.font.size = Pt(11)

    t_sig = doc.add_table(rows=1, cols=3)
    t_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    sc1, sc2, sc3 = t_sig.rows[0].cells
    sc1.paragraphs[0].add_run("Signature\nHead of the Department").font.size = Pt(9.5)
    sc2.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3 = sanitize_img('extracted_images/p2_img3_16.jpeg')
    if p3: sc2.paragraphs[0].add_run().add_picture(p3, width=Inches(0.85))
    sc2.paragraphs[0].add_run("\nSeal of the Institute").font.size = Pt(8.5)
    sc3.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
    sc3.paragraphs[0].add_run("Signature\nHead of the Institute").font.size = Pt(9.5)

    doc.add_page_break()

    # ==========================================
    # PAGE 3: INTRODUCTION OF INDUSTRY
    # ==========================================
    add_page_header_number(3)
    add_chapter_title("INTRODUCTION OF INDUSTRY")
    add_img('extracted_images/p3_img1_21.jpeg', width_in=2.2)
    
    p_det = doc.add_paragraph()
    p_det.paragraph_format.space_before = Pt(10)
    p_det.paragraph_format.line_spacing = 1.25
    for label, val in [
        ("Company Name", "Indradeep Information Technology Pvt. Ltd."),
        ("Company Establish", "2010"),
        ("Type of Company", "Private Limited"),
        ("Company Address", "Sangli ( Gheware Capital, 1st Floor, Near Bus stand)\nSatara ( Hem Empire, Above Sai Net Café Powai Naka)"),
        ("Field of Working", "Information Technology & Artificial Intelligence"),
        ("Company Officials", "Mr. Dilip Lalaso Patil - Chairmen\nMr. Maheshkuamr S Lakade - CEO"),
    ]:
        r1 = p_det.add_run(f"{label:<22} : ")
        r1.bold = True
        r1.font.size = Pt(10.5)
        r2 = p_det.add_run(f"{val}\n")
        r2.font.size = Pt(10.5)

    add_subheading("Company Services :")
    add_body(
        "As an IT and Software Engineering company, Indradeep Information Technology Pvt. Ltd. offers a comprehensive range of services related to software development, web applications, cloud systems and Artificial Intelligence infrastructure. Here's a list of common services that such companies might provide:"
    )
    add_bullet("1 Network Design and Implementation")
    add_bullet("2 Hardware Installation and Maintenance")
    add_bullet("3 Server Configuration and Management")
    add_bullet("4 Data Center Solution")
    add_bullet("5 Cloud Computing Services & Artificial Intelligence Solutions")

    doc.add_page_break()

    # ==========================================
    # PAGE 4: TRAINING CERTIFICATE (User Uploaded Industry Training Cert)
    # ==========================================
    add_page_header_number(4)
    add_chapter_title("Training Certificate")
    add_img('extracted_images/cert_industry_training.jpg', width_in=5.8)

    doc.add_page_break()

    # ==========================================
    # PAGE 5: WORKSHOP / SEMINAR CERTIFICATE (User Uploaded IRCT Cert)
    # ==========================================
    add_page_header_number(5)
    add_chapter_title("Workshop / Seminar Certificate")
    add_img('extracted_images/cert_workshop_seminar.jpg', width_in=5.8)

    doc.add_page_break()

    # ==========================================
    # PAGE 6: TECHNICAL CERTIFICATIONS (Sharvari Prashant Pawar updated certs)
    # ==========================================
    add_page_header_number(6)
    add_chapter_title("Technical Certifications")
    add_img('extracted_images/cert_technical_1_sharvari.jpeg', width_in=5.0)
    add_img('extracted_images/cert_technical_2_sharvari.jpeg', width_in=5.0)

    doc.add_page_break()

    # ==========================================
    # PAGE 7: ABSTRACT
    # ==========================================
    add_page_header_number(7)
    add_chapter_title("Abstract")
    
    p_abs_meta = doc.add_paragraph()
    p_abs_meta.paragraph_format.space_after = Pt(10)
    r1 = p_abs_meta.add_run("In-Plant Training Report: Artificial Intelligence & Web Application Development\n")
    r1.bold = True
    r2 = p_abs_meta.add_run("A Report by: Sharvari Prashant Pawar\n")
    r2.bold = True
    r2.font.color.rgb = RGBColor(180, 20, 20)

    add_body(
        "This report presents an overview of my In-Plant Training experience in Artificial Intelligence & Web Application Development at Indradeep Information Technology Pvt. Ltd."
    )
    add_body(
        "During the training period, I gained practical knowledge of modern web application development and AI integration using Visual Studio Code (VS Code), JavaScript (ES6+), React.js and Vite. I studied various concepts related to web application development, including project structure, components, state management, hooks (useState, useEffect), user interface components, layouts, LocalStorage database, APIs, debugging, testing and production build generation."
    )
    add_body(
        "The training included practical exercises and project-based learning. I worked on web projects and learned how to create components, design responsive neon application interfaces, manage application data using LocalStorage and understand the integration of Generative AI (Google Gemini API) in web applications. I also gained practical experience in identifying and solving errors during application development."
    )
    add_body(
        "This training helped me understand the practical workflow of web and AI application development, starting from project creation and coding in VS Code to testing and generating an optimized production build. It improved my programming, problem-solving and debugging skills and gave me valuable exposure to a professional software development environment. Overall, the In-Plant Training provided me with a strong practical foundation in Artificial Intelligence & Web Development and helped me connect the theoretical knowledge gained during my Diploma in Computer Engineering with real-world application development."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 8: INDEX - PART 1 (Phases 1 to 7)
    # ==========================================
    add_page_header_number(8)
    add_chapter_title("Index")
    
    table_idx1 = doc.add_table(rows=1, cols=4)
    table_idx1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_idx1, color="333333", sz="4")
    
    widths = [Inches(0.6), Inches(2.2), Inches(3.2), Inches(0.6)]
    
    hdr = table_idx1.rows[0].cells
    hdr[0].text = "Sr.No"
    hdr[1].text = "Name of Phases"
    hdr[2].text = "Concepts"
    hdr[3].text = "Page\nNo."
    
    for i, c in enumerate(hdr):
        c.width = widths[i]
        set_cell_margins(c, 70, 70, 90, 90)
        c.paragraphs[0].runs[0].font.name = "Times New Roman"
        c.paragraphs[0].runs[0].font.size = Pt(10)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

    idx1_rows = [
        ("1.", "Introduction to Web Development & Modern Web Technologies",
         "1.1 Introduction to Web Development\n1.2 History & Evolution of Web\n1.3 Features & Advantages of Web Applications", "10"),
        ("2.", "Visual Studio Code & Development Environment",
         "2.1 Introduction to VS Code & Interface\n2.2 Node.js & npm\n2.3 Browser DevTools & Vite Server\n2.4 Installation & Setup of VS Code", "13"),
        ("3.", "Modern JavaScript (ES6+) Programming",
         "3.1 Introduction to JavaScript (ES6+)\n3.2 Variables, Constants & Data Types\n3.3 Input/Output & Conditionals\n3.4 Loops & Functions\n3.5 Arrays, Objects & Array Methods", "17"),
        ("4.", "React & Vite Project Structure",
         "4.1 Creating a Web Project\n4.2 Project Files, Folders & Resources\n4.3 package.json & Configuration Files", "23"),
        ("5.", "React Component & UI Development",
         "5.1 React Components & JSX\n5.2 Component Lifecycle & Hooks\n5.3 UI Layouts & Components\n5.4 Dynamic Lists & Modal Dialogs", "26"),
        ("6.", "Client Storage & AI API Integration",
         "6.1 Introduction to LocalStorage\n6.2 Data Modeling with JSON\n6.3 CRUD Operations\n6.4 API, JSON & Gemini AI Integration", "30"),
        ("7.", "Web Project Development & Testing",
         "7.1 Project Selection & Requirement Analysis\n7.2 Project Design & Feature Implementation\n7.3 Database & API Integration\n7.4 Testing & Debugging", "34"),
    ]

    for sr, phase, conc, pg in idx1_rows:
        row = table_idx1.add_row().cells
        row[0].text = sr
        row[1].text = phase
        row[2].text = conc
        row[3].text = pg
        row[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row[3].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        for i, c in enumerate(row):
            c.width = widths[i]
            set_cell_margins(c, 60, 60, 80, 80)
            c.paragraphs[0].runs[0].font.name = "Times New Roman"
            c.paragraphs[0].runs[0].font.size = Pt(9.5)

    doc.add_page_break()

    # ==========================================
    # PAGE 9: INDEX - PART 2 (Phases 8 to 10)
    # ==========================================
    add_page_header_number(9)
    
    table_idx2 = doc.add_table(rows=1, cols=4)
    table_idx2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_idx2, color="333333", sz="4")
    
    hdr2 = table_idx2.rows[0].cells
    hdr2[0].text = "Sr.No"
    hdr2[1].text = "Name of Phases"
    hdr2[2].text = "Concepts"
    hdr2[3].text = "Page\nNo."
    for i, c in enumerate(hdr2):
        c.width = widths[i]
        set_cell_margins(c, 70, 70, 90, 90)
        c.paragraphs[0].runs[0].font.name = "Times New Roman"
        c.paragraphs[0].runs[0].font.size = Pt(10)
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

    idx2_rows = [
        ("8.", "Production Build & Web Deployment",
         "8.1 Introduction to Web Build\n8.2 Build Process & Asset Bundling\n8.3 Testing Production Build\n8.4 Application Deployment & ngrok", "38"),
        ("9.", "Practicals & Conclusion",
         "9.1 VS Code Setup Practical\n9.2 React Project Creation Practical\n9.3 JavaScript Programming Practical\n9.4 React Hooks Practical\n9.5 UI Design Practical\n9.6 LocalStorage & CRUD Practical\n9.7 Gemini AI Integration Practical\n9.8 Debugging Practical\n9.9 Production Build Practical", "41"),
        ("10.", "Project Development",
         "10.1 Project Overview & Objective\n10.2 Requirements & Technologies Used\n10.3 Project Features & Working\n10.4 Database, Testing & Results", "51"),
    ]

    for sr, phase, conc, pg in idx2_rows:
        row = table_idx2.add_row().cells
        row[0].text = sr
        row[1].text = phase
        row[2].text = conc
        row[3].text = pg
        row[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row[3].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        for i, c in enumerate(row):
            c.width = widths[i]
            set_cell_margins(c, 60, 60, 80, 80)
            c.paragraphs[0].runs[0].font.name = "Times New Roman"
            c.paragraphs[0].runs[0].font.size = Pt(9.5)

    doc.add_page_break()

    # ==========================================
    # PAGE 10: 1. INTRODUCTION TO WEB DEVELOPMENT
    # ==========================================
    add_page_header_number(10)
    add_chapter_title("1. Introduction to Web Development")
    add_subheading("1.1 INTRODUCTION TO WEB DEVELOPMENT")
    add_body(
        "Web development is the process of building, creating and maintaining websites and web applications that run in web browsers. It is based on standard internet protocols and provides a platform for developing interactive and intelligent web applications."
    )
    add_body(
        "Modern web applications are mainly developed using JavaScript, React.js and CSS3. Visual Studio Code (VS Code) is used to create, test and debug web applications."
    )
    add_body(
        "Web development provides features such as user-friendly interface, multitasking, connectivity, multimedia support and cloud AI integration. It is widely used in education, business, entertainment, communication and healthcare."
    )
    add_subheading("Web Applications")
    add_body("Web applications are software programs designed to perform specific tasks inside web browsers.")
    add_body("Common Applications:")
    add_bullet("- Education: Learning, tutorial and study portals.")
    add_bullet("- Business: Banking, e-commerce and shopping platforms.")
    add_bullet("- Entertainment: Music, video streaming and gaming web apps.")
    add_bullet("- Communication: Messaging, video conferencing and email apps.")
    add_bullet("- Healthcare: Health portals and appointment booking apps.")
    add_body("Thus, web development provides a flexible platform for developing applications according to user requirements.")

    doc.add_page_break()

    # ==========================================
    # PAGE 11: 1.2 HISTORY OF WEB & JAVASCRIPT
    # ==========================================
    add_page_header_number(11)
    add_subheading("1.2 HISTORY & EVOLUTION OF WEB APPLICATIONS")
    add_body(
        "The World Wide Web was initially developed by Tim Berners-Lee in 1989. In 1995, Brendan Eich developed JavaScript to bring dynamic behavior to web browsers. Over the decades, web technologies continued to develop into modern single-page web applications."
    )
    add_body(
        "The first modern JavaScript frameworks emerged around 2010. In 2013, React.js was released by Meta, revolutionizing frontend development with a component-based architecture and Virtual DOM. After that, web development continued to develop through different versions with improvements in performance, security, user interface and cloud AI support."
    )
    add_body(
        "Today, modern web applications are widely used on smartphones, laptops, tablets, smart TVs and desktop computers. Its continuous development and integration with Artificial Intelligence models such as Google Gemini have made it an essential platform for modern software development."
    )
    add_img('extracted_images/p11_img1_47.jpeg', width_in=4.4, caption="Web & Mobile Technology Evolution Timeline")

    doc.add_page_break()

    # ==========================================
    # PAGE 12: 1.3 FEATURES & ADVANTAGES OF WEB
    # ==========================================
    add_page_header_number(12)
    add_subheading("1.3 FEATURES & ADVANTAGES OF WEB APPLICATIONS")
    add_body(
        "Web development is a popular and powerful platform that provides many useful features for users and developers."
    )
    add_body("Main Features and Advantages:")
    add_bullet("1. Cross-Platform: Runs on Windows, macOS, Linux, Android and iOS without changes.")
    add_bullet("2. User-Friendly: Provides a simple, interactive and responsive interface.")
    add_bullet("3. Multitasking: Users can perform multiple tasks using different web tabs and components.")
    add_bullet("4. Connectivity: Connects seamlessly with cloud servers, REST APIs and AI models.")
    add_bullet("5. Multimedia Support: Supports audio, video, SVG graphics, canvas and animations.")
    add_bullet("6. Customization: Applications can be styled and customized according to user requirements.")
    add_bullet("7. Easy Development: VS Code provides rich tools for coding, testing and debugging.")
    add_bullet("8. Zero Installation: Users access web applications directly without manual app installs.")
    add_bullet("9. Large Ecosystem: npm provides millions of reusable open-source packages.")
    add_bullet("10. Regular Updates: Web applications update automatically without user effort.")
    add_body("These features make web development a flexible and suitable platform for modern application engineering.")

    doc.add_page_break()

    # ==========================================
    # PAGE 13: 2. VISUAL STUDIO CODE & ENVIRONMENT
    # ==========================================
    add_page_header_number(13)
    add_chapter_title("2. Visual Studio Code & Development Environment")
    add_subheading("2.1 INTRODUCTION TO VISUAL STUDIO CODE & INTERFACE")
    add_body(
        "Visual Studio Code (VS Code) is the official IDE (Integrated Development Environment) developed by Microsoft to build modern web and cloud applications. It supports JavaScript, React, HTML, CSS and Node.js."
    )
    add_body("It provides tools for coding, UI design, testing, debugging and building applications.")
    add_body("Main Parts:")
    add_bullet("1. Activity Bar – Switches between views like Explorer, Search, Git and Extensions.")
    add_bullet("2. Side Bar / Explorer – Manages project files and folders.")
    add_bullet("3. Code Editor – Used to write and edit source code.")
    add_bullet("4. Integrated Terminal – Runs npm scripts, build commands and PowerShell.")
    add_bullet("5. Status Bar – Displays Git branch, file encoding, errors and warnings.")
    add_img('extracted_images/diagram_vscode_arch.png', width_in=5.2, caption="Figure 2.1: VS Code Web Development Architecture")
    add_body("Thus, Visual Studio Code provides a complete environment for modern web application development.")

    doc.add_page_break()

    # ==========================================
    # PAGE 14: 2.2 NODE.JS & NPM
    # ==========================================
    add_page_header_number(14)
    add_subheading("2.2 NODE.JS & NPM (NODE PACKAGE MANAGER)")
    add_body("Node.js and npm are important components used in modern web application development.")
    add_subheading("Node.js")
    add_body(
        "Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser. It provides the runtime required to run build tools and development servers on a computer."
    )
    add_body("Main components of Node.js:")
    add_bullet("- V8 Engine: Executes JavaScript code at ultra-high speed.")
    add_bullet("- File System & Core Modules: Handles project files, directories and system I/O.")
    add_bullet("- HTTP Server Engine: Powers local development servers.")
    add_bullet("- Asynchronous Event Loop: Manages non-blocking operations efficiently.")
    add_subheading("npm")
    add_body(
        "npm stands for Node Package Manager. It provides the tools required for downloading, installing and managing third-party libraries and dependencies used in web projects."
    )
    add_body("Importance:")
    add_bullet("- Supports application development, bundling and building.")
    add_bullet("- Provides required libraries such as React, Lucide-React and Vite.")
    add_bullet("- Helps compile and execute application scripts defined in package.json.")
    add_bullet("- Works seamlessly with Visual Studio Code.")
    add_body("Thus, Node.js and npm provide essential components required for successfully developing web applications.")

    doc.add_page_break()

    # ==========================================
    # PAGE 15: 2.3 BROWSER DEVTOOLS & VITE DEV SERVER
    # ==========================================
    add_page_header_number(15)
    add_subheading("2.3 BROWSER DEVELOPER TOOLS & VITE DEV SERVER")
    add_body(
        "Browser Developer Tools (DevTools) is a built-in diagnostic and debugging suite available inside web browsers like Google Chrome and Microsoft Edge. It allows developers to test, inspect and debug web applications in real-time."
    )
    add_body(
        "Vite Dev Server is an ultra-fast local web server that serves web applications during development with Hot Module Replacement (HMR). It updates modified code instantly without refreshing the entire web page."
    )
    add_body("Uses:")
    add_bullet("1. Helps test applications during development.")
    add_bullet("2. Allows testing on different screen sizes using Device Emulation Mode.")
    add_bullet("3. Inspects DOM elements and styles in real-time.")
    add_bullet("4. Helps identify JavaScript console errors and network requests.")
    add_bullet("5. Provides an Application tab to view LocalStorage data records.")
    add_body(
        "The browser DevTools and Vite dev server work together to run and test web applications. During the training, they were used to run and test applications developed in Visual Studio Code."
    )
    add_img('extracted_images/p15_img1_63.jpeg', width_in=3.8, caption="Figure 2.3: Device Emulation & Responsive Testing")

    doc.add_page_break()

    # ==========================================
    # PAGE 16: 2.4 INSTALLATION & SETUP OF VS CODE
    # ==========================================
    add_page_header_number(16)
    add_subheading("2.4 INSTALLATION & SETUP OF VISUAL STUDIO CODE")
    add_body(
        "Visual Studio Code installation and setup is the first step for starting web application development. Proper setup provides all the tools required to create, build and test applications."
    )
    add_body("Steps for Installation and Setup:")
    add_bullet("1. Download VS Code: Download the official installer from the official website.")
    add_bullet("2. Install VS Code: Run the installer and complete the installation process.")
    add_bullet("3. Install Node.js: Download and install the LTS version of Node.js and npm.")
    add_bullet("4. Configure Extensions: Install ESLint, Prettier and ES7+ React snippets.")
    add_bullet("5. Configure Terminal: Set integrated terminal to PowerShell in VS Code.")
    add_bullet("6. Configure Browser: Install Google Chrome for browser developer tools and testing.")
    add_bullet("7. Create New Project: Run 'npm create vite@latest' to scaffold a new React project.")
    add_bullet("8. Run Application: Start the project using 'npm run dev' and view in browser.")
    add_body(
        "A proper installation and configuration of Visual Studio Code provides a suitable environment for web and AI application development."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 17: 3. MODERN JAVASCRIPT PROGRAMMING
    # ==========================================
    add_page_header_number(17)
    add_chapter_title("3. Modern JavaScript (ES6+) Programming")
    add_subheading("3.1 INTRODUCTION TO JAVASCRIPT (ES6+)")
    add_body(
        "JavaScript is a modern, versatile and dynamic programming language used for web application development. ECMAScript 6 (ES6+) introduced modern features that make JavaScript ideal for enterprise application development."
    )
    add_body(
        "JavaScript provides simple and readable syntax, which helps developers write applications with less code. It also supports important features such as block scope, arrow functions, template literals, classes, modules and asynchronous handling."
    )
    add_body("Features of Modern JavaScript:")
    add_bullet("1. Simple Syntax: Easy to read and understand.")
    add_bullet("2. Concise Code: Reduces unnecessary boilerplate code.")
    add_bullet("3. Component Support: Powers React.js component architectures.")
    add_bullet("4. Interoperability: Can work with REST APIs and cloud services.")
    add_bullet("5. Asynchronous: Supports Promises and async/await for network requests.")
    add_bullet("6. Widely Supported: Executed natively by all modern web browsers.")
    add_body(
        "During the training, JavaScript (ES6+) was used to write source code and implement different features of web applications."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 18: 3.2 VARIABLES, DATA TYPES & OPERATORS
    # ==========================================
    add_page_header_number(18)
    add_subheading("3.2 VARIABLES, CONSTANTS, DATA TYPES & OPERATORS")
    add_body(
        "Variables and constants are used to store values in JavaScript. 'let' is used for changeable values, while 'const' is used for read-only constant values."
    )
    add_body("Example:")
    add_body("let age = 18;\nconst name = \"Sharvari\";")
    add_body("Common Data Types:")
    add_bullet("- Number – Integer and decimal values (e.g. 24999)")
    add_bullet("- String – Text values (e.g. \"AI Assistant\")")
    add_bullet("- Boolean – True or False")
    add_bullet("- Object – Key-value pairs (e.g. { id: 1, name: \"Phone\" })")
    add_bullet("- Array – Ordered lists of items (e.g. [1, 2, 3])")
    add_body("Operators:")
    add_body("Operators are symbols used to perform operations.")
    add_bullet("- Arithmetic: +, -, *, /, %")
    add_bullet("- Assignment: =, +=, -=")
    add_bullet("- Relational: >, <, ==, ===, !=")
    add_bullet("- Logical: &&, ||, !")
    add_body("These concepts are commonly used in JavaScript and web applications.")

    doc.add_page_break()

    # ==========================================
    # PAGE 19: 3.3 I/O & CONDITIONAL STATEMENTS
    # ==========================================
    add_page_header_number(19)
    add_subheading("3.3 INPUT/OUTPUT & CONDITIONAL STATEMENTS")
    add_body(
        "Input and output operations are used to receive data and display results in a JavaScript program. The 'prompt()' or HTML input elements are used for input, while 'console.log()' and DOM manipulation are used for output."
    )
    add_body("Example:")
    add_body("const name = \"Sharvari\";\nconsole.log(`Hello ${name}`);")
    add_body("Conditional statements are used to make decisions based on given conditions.")
    add_body("Main Conditional Statements:")
    add_bullet("1. if: Executes code when a condition is true.")
    add_bullet("2. if-else: Executes different code depending on the condition.")
    add_bullet("3. else-if: Checks multiple conditions sequentially.")
    add_bullet("4. switch: Selects an option from multiple conditions.")
    add_body(
        "These concepts are useful for accepting user information, displaying results and implementing decision-making logic in web applications."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 20: 3.4 LOOPS & FUNCTIONS
    # ==========================================
    add_page_header_number(20)
    add_subheading("3.4 LOOPS & FUNCTIONS")
    add_body(
        "Loops and functions are important concepts in JavaScript programming. Loops are used to execute a block of code repeatedly, while functions are used to perform a specific task. They help reduce code repetition and make programs easier to manage."
    )
    add_subheading("Loops")
    add_body("A loop repeatedly executes a set of statements until a condition is satisfied.")
    add_bullet("1. for Loop: Used to repeat statements over a range:\nfor (let i = 1; i <= 5; i++) {\n  console.log(i);\n}")
    add_bullet("2. while Loop: Executes statements as long as the given condition is true:\nlet i = 1;\nwhile (i <= 5) {\n  console.log(i);\n  i++;\n}")
    add_bullet("3. do-while Loop: Executes the statements at least once and then checks the condition:\nlet i = 1;\ndo {\n  console.log(i);\n  i++;\n} while (i <= 5);")

    doc.add_page_break()

    # ==========================================
    # PAGE 21: 3.4 FUNCTIONS & ARROW FUNCTIONS
    # ==========================================
    add_page_header_number(21)
    add_subheading("Functions")
    add_body(
        "A function is a reusable block of code that performs a particular task. It can accept parameters and return a value."
    )
    add_body("Example (Standard Function):")
    add_body("function add(a, b) {\n  return a + b;\n}")
    add_body("Example (Modern Arrow Function):")
    add_body("const add = (a, b) => a + b;")
    add_body("Advantages of Functions:")
    add_bullet("- Reduces code repetition.")
    add_bullet("- Improves code reusability.")
    add_bullet("- Makes programs easier to understand.")
    add_bullet("- Helps organize program logic.")
    add_body(
        "Loops and functions are widely used in web applications to handle repeated tasks and implement application logic efficiently."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 22: 3.5 ARRAYS, OBJECTS & ARRAY METHODS
    # ==========================================
    add_page_header_number(22)
    add_subheading("3.5 ARRAYS, OBJECTS & MODERN ARRAY METHODS")
    add_body(
        "Arrays and objects are used in JavaScript to store multiple values in a single variable. They are useful for managing data in web applications."
    )
    add_body("1. Array:\nStores multiple values of the same or different types with dynamic size.\nExample:\nconst numbers = [10, 20, 30];")
    add_body("2. Object:\nStores data in key-value pairs representing an entity.\nExample:\nconst product = { id: 1, name: \"Phone\", price: 24999 };")
    add_body("3. Array Methods (map, filter):\nTransform and filter array data cleanly in modern web applications.\nExample:\nconst names = [\"Phone\", \"Laptop\"];\nnames.push(\"Watch\");\nconst filtered = numbers.filter(n => n > 15);")
    add_body("Arrays, objects and array methods are useful for storing and managing data in web applications.")

    doc.add_page_break()

    # ==========================================
    # PAGE 23: 4. REACT & VITE PROJECT STRUCTURE
    # ==========================================
    add_page_header_number(23)
    add_chapter_title("4. React & Vite Project Structure")
    add_subheading("4.1 CREATING A WEB PROJECT")
    add_body(
        "Creating a web project is the first step in web application development. Vite provides a simple and fast process for creating and configuring a new React project."
    )
    add_body("Steps to Create a Web Project:")
    add_bullet("1. Open Visual Studio Code.")
    add_bullet("2. Open Integrated Terminal.")
    add_bullet("3. Run command: npm create vite@latest ai-shopping-assistant.")
    add_bullet("4. Select 'React' as the framework.")
    add_bullet("5. Select 'JavaScript' as the variant.")
    add_bullet("6. Navigate to folder: cd ai-shopping-assistant.")
    add_bullet("7. Run 'npm install' to install dependencies.")
    add_bullet("8. Vite creates the required files and folders automatically.")
    add_body(
        "After creating the project, developers can write JavaScript/React code, design the user interface, run the application and test its functionality."
    )
    add_body(
        "During training, web projects were created in VS Code and different features were implemented and tested."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 24: 4.2 PROJECT FILES, FOLDERS & RESOURCES
    # ==========================================
    add_page_header_number(24)
    add_subheading("4.2 PROJECT FILES, FOLDERS & RESOURCES")
    add_body("A web project contains different files and folders used to develop and manage an application.")
    add_body("Main Files and Folders:")
    add_bullet("1. index.html: Root HTML file that mounts the React application.")
    add_bullet("2. src/: Contains source code files (main.jsx, styles.css).")
    add_bullet("3. components/: Contains modular reusable UI components (Admin, Checkout, Compare).")
    add_bullet("4. data/: Contains application data layers (products.js, storage.js, i18n.js).")
    add_bullet("5. public/: Stores static assets, icons and images.")
    add_bullet("6. package.json: Contains project dependencies, metadata and scripts.")
    add_bullet("7. vite.config.js: Configuration file for Vite dev server and bundler.")
    add_body(
        "Source files contain the application logic, while component files are used for designing and managing application screens."
    )
    add_body(
        "Understanding the project structure helps developers organize and manage web applications properly."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 25: 4.3 PACKAGE.JSON & CONFIGURATION FILES
    # ==========================================
    add_page_header_number(25)
    add_subheading("4.3 PACKAGE.JSON & CONFIGURATION FILES")
    add_body(
        "'package.json' and configuration files are important parts of a web project. They provide application information and manage project dependencies and build configuration."
    )
    add_body("1. package.json:\nThe project manifest file that contains important information about the application. It defines project name, dependencies, scripts and build configurations.")
    add_body("2. .env Configuration File:\nEnvironment variable file used to store sensitive API keys securely, such as the Google Gemini AI API key.")
    add_body("Main Uses:")
    add_bullet("- Define application information.")
    add_bullet("- Specify required dependencies (React, Lucide icons).")
    add_bullet("- Manage project scripts (dev, build, preview).")
    add_bullet("- Configure secure API keys.")
    add_bullet("- Build the production web application.")
    add_body(
        "These files help Visual Studio Code and Vite properly configure, build and run a web application."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 26: 5. REACT COMPONENT & UI DEVELOPMENT
    # ==========================================
    add_page_header_number(26)
    add_chapter_title("5. React Component & UI Development")
    add_subheading("5.1 REACT COMPONENTS, STATE & PROPS")
    add_body("React components are the basic building blocks of a modern web application.")
    add_body("Main Components:")
    add_bullet("- Functional Component: Represents a reusable UI part and provides user interaction.")
    add_bullet("- Props: Passes data and handlers from parent components to child components.")
    add_bullet("- State: Manages dynamic internal data that changes over time.")
    add_bullet("- JSX: Syntax extension that allows writing HTML structure inside JavaScript.")
    add_subheading("Components & Navigation")
    add_body("A Component represents a section or screen of an application, such as ProductCard or ChatModal.")
    add_body("Example:")
    add_body("function ProductCard({ product, onAddToCart }) {\n  return (\n    <div className=\"product-card\">\n      <h3>{product.name}</h3>\n      <button onClick={() => onAddToCart(product)}>Add to Cart</button>\n    </div>\n  );\n}")
    add_body(
        "Thus, Components provide screens while state and handlers help in navigation and communication between components."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 27: 5.2 COMPONENT LIFECYCLE & HOOKS
    # ==========================================
    add_page_header_number(27)
    add_subheading("5.2 COMPONENT LIFECYCLE & REACT HOOKS")
    add_body(
        "The Component Lifecycle describes the different phases a component goes through: Mounting, Updating and Unmounting. React provides Hooks to manage these states in functional components."
    )
    add_body("Main React Hooks:")
    add_bullet("1. useState() – Called to initialize and manage component state.")
    add_bullet("2. useEffect() – Called when component mounts or updates, used for side effects and data fetching.")
    add_bullet("3. useMemo() – Caches expensive calculations like product filtering and sorting.")
    add_bullet("4. useCallback() – Prevents unnecessary child re-renders by caching callback functions.")
    add_img('extracted_images/p27_img1_88.jpeg', width_in=3.6, caption="Figure 5.2: Application Lifecycle & State Management")
    add_body(
        "Understanding the Component Lifecycle helps developers manage application resources and handle screen updates properly."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 28: 5.3 UI LAYOUTS & COMPONENTS
    # ==========================================
    add_page_header_number(28)
    add_subheading("5.3 UI LAYOUTS & COMPONENTS")
    add_body(
        "User Interface (UI) is the visual part of a web application through which users interact with the application. Modern CSS provides different layouts and UI components for designing application screens."
    )
    add_body("Common UI Layouts:")
    add_bullet("1. CSS Flexbox – Arranges elements dynamically in rows or columns.")
    add_bullet("2. CSS Grid – Positions elements in two-dimensional responsive grids.")
    add_bullet("3. Fixed / Modal Overlay – Places modal dialogs and backdrops on top of screens.")
    add_body("Common UI Components:")
    add_bullet("- Heading & Text – Displays titles and product descriptions.")
    add_bullet("- Input & Range Slider – Accepts user search terms and price thresholds.")
    add_bullet("- Button – Performs an action when clicked (e.g. Add to Cart, Buy Now).")
    add_bullet("- Card – Displays product image, title, price, discount and rating.")
    add_bullet("- Badge – Highlights stock status, special discounts and categories.")
    add_body(
        "UI layouts and components help developers create interactive, user-friendly and attractive neon application screens."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 29: 5.4 DYNAMIC LISTS & MODAL DIALOGS
    # ==========================================
    add_page_header_number(29)
    add_subheading("5.4 DYNAMIC LISTS & MODAL DIALOGS")
    add_body(
        "Dynamic List rendering is a web UI technique used to display a large set of data in a responsive grid or list format. It maps array items into individual cards efficiently."
    )
    add_subheading("Modal Dialogs")
    add_body(
        "A Modal Dialog appears on top of the main screen to show detailed information without leaving the current page, such as the Ask Nexa Chatbot and Product Quick View."
    )
    add_body("Main Components:")
    add_bullet("1. Product Grid – Displays the responsive collection of product cards.")
    add_bullet("2. Array.map() – Iterates through data array and renders components.")
    add_bullet("3. Modal Backdrop – Dark glassmorphic background layer focusing the modal.")
    add_bullet("4. Modal Card – Centered dialog containing detailed specifications or AI chat.")
    add_body("Uses:")
    add_bullet("- Displaying catalog of electronics, smartphones and laptops.")
    add_bullet("- Showing AI assistant shopping conversations.")
    add_bullet("- Displaying cart items and order histories.")
    add_body(
        "Dynamic lists and modal dialogs are useful for displaying dynamic and large amounts of data efficiently in web applications."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 30: 6. CLIENT STORAGE & AI API
    # ==========================================
    add_page_header_number(30)
    add_chapter_title("6. Client Storage & AI API Integration")
    add_subheading("6.1 INTRODUCTION TO LOCALSTORAGE")
    add_body(
        "LocalStorage is a lightweight, built-in client-side database used to store data in web applications. It stores key-value pairs locally on the user's browser."
    )
    add_body(
        "LocalStorage does not require a separate database server because the data is stored securely on the client machine. It supports instant data retrieval and persists across browser sessions."
    )
    add_body("Features of LocalStorage:")
    add_bullet("1. Lightweight – Requires zero server configuration or network overhead.")
    add_bullet("2. Local Storage – Stores data directly inside the browser.")
    add_bullet("3. Serverless – Does not require an external database server for client state.")
    add_bullet("4. Persistence – Data remains intact even after closing or refreshing the browser.")
    add_bullet("5. Fast and Reliable – Provides instantaneous synchronous data storage and retrieval.")
    add_bullet("6. Easy to Use – Can be easily integrated using simple setItem and getItem methods.")
    add_body("LocalStorage can be used to store user profiles, cart items, wishlists, orders and custom products.")
    add_body(
        "During training, LocalStorage was used to create databases, store records and perform basic database operations in web applications."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 31: 6.2 DATA MODELING WITH JSON
    # ==========================================
    add_page_header_number(31)
    add_subheading("6.2 DATA MODELING WITH JSON & STORAGE HELPER")
    add_body(
        "In modern web applications, JSON (JavaScript Object Notation) and a 'Storage' helper module are used to manage the LocalStorage database. It helps in creating records, serializing data and performing database operations."
    )
    add_subheading("Storage Helper")
    add_body("A custom utility module is created to manage storage operations.")
    add_body("It provides methods such as:")
    add_bullet("- JSON.stringify() – Converts complex JavaScript objects and arrays into JSON strings for storage.")
    add_bullet("- JSON.parse() – Converts stored JSON strings back into usable JavaScript objects.")
    add_subheading("Tables / Entities")
    add_body(
        "Data is organized into structured records with defined properties. Each record contains attributes that define the item."
    )
    add_body(
        "For example, the application stores a User Cart table with attributes such as Product ID, Name, Price, Quantity and Image."
    )
    add_body(
        "Storage helpers and JSON modeling help web applications store and manage data in an organized manner."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 32: 6.3 CRUD OPERATIONS
    # ==========================================
    add_page_header_number(32)
    add_subheading("6.3 CRUD OPERATIONS")
    add_body(
        "CRUD stands for Create, Read, Update and Delete. These are the four basic operations used to manage data in a database. CRUD operations help a web application store and manage records effectively."
    )
    add_body("1. Create:\nThe Create operation is used to insert new records into storage. For example, adding an item to the shopping cart or placing a new customer order.")
    add_body("2. Read:\nThe Read operation is used to retrieve stored data from storage and display it in the application.")
    add_body("3. Update:\nThe Update operation is used to modify existing records. For example, changing product quantities or toggling wishlist status.")
    add_body("4. Delete:\nThe Delete operation is used to remove unwanted records from storage, such as removing an item from the cart.")
    add_img('extracted_images/p47_img1_141.jpeg', width_in=4.0, caption="Figure 6.3: CRUD Operations Architecture")
    add_body("Importance of CRUD Operations:")
    add_bullet("- Helps manage application data effectively.")
    add_bullet("- Allows users to add and view records dynamically.")
    add_bullet("- Makes it possible to modify existing cart information.")
    add_bullet("- Helps remove unnecessary data.")
    add_body(
        "During training, CRUD operations were practiced using LocalStorage to understand how records can be inserted, displayed, updated and deleted in a web application."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 33: 6.4 API, JSON & GEMINI AI INTEGRATION
    # ==========================================
    add_page_header_number(33)
    add_subheading("6.4 API, JSON & GEMINI AI INTEGRATION")
    add_body(
        "API (Application Programming Interface) allows web applications to communicate with external AI services and exchange data."
    )
    add_body(
        "JSON (JavaScript Object Notation) is a lightweight data format used to transfer data between web applications and cloud servers."
    )
    add_body("API Integration Process:")
    add_bullet("1. User submits inquiry in Ask Nexa chat.")
    add_bullet("2. Send HTTPS POST request to Google Gemini API.")
    add_bullet("3. Receive intelligent response from server.")
    add_bullet("4. Parse JSON / text data.")
    add_bullet("5. Display recommendations in the application.")
    add_img('extracted_images/p33_img1_101.jpeg', width_in=4.4, caption="Figure 6.4: Client-API Communication Flow")
    add_body(
        "APIs are useful for applications such as Artificial Intelligence, weather, payment and news. During training, Google Gemini AI API integration was studied and implemented."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 34: 7. PROJECT DEVELOPMENT & TESTING
    # ==========================================
    add_page_header_number(34)
    add_chapter_title("7. Web Project Development & Testing")
    add_subheading("7.1 PROJECT SELECTION & REQUIREMENT ANALYSIS")
    add_body(
        "Project selection is the process of choosing a suitable project based on purpose, requirements and available technologies. During training, an AI Shopping Assistant project was selected to apply the concepts learned in web and AI development."
    )
    add_body(
        "Requirement Analysis is the process of identifying what the application should do and what features are required."
    )
    add_body("Main Steps:")
    add_bullet("1. Identify the purpose of the project.")
    add_bullet("2. Identify user requirements (smart shopping, AI recommendations, price filters).")
    add_bullet("3. Decide the required features (Ask Nexa AI, Cart, Wishlist, Compare, Admin).")
    add_bullet("4. Select suitable technologies and tools (VS Code, React, Vite, Gemini API).")
    add_bullet("5. Analyze data and database requirements (LocalStorage CRUD).")
    add_bullet("6. Plan the basic application structure.")
    add_body(
        "Proper project selection and requirement analysis help in developing an application according to user needs and reduce errors during development."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 35: 7.2 PROJECT DESIGN & IMPLEMENTATION
    # ==========================================
    add_page_header_number(35)
    add_subheading("7.2 PROJECT DESIGN, DEVELOPMENT & FEATURE IMPLEMENTATION")
    add_body(
        "Project design defines the structure and user interface of a web application. Development involves implementing the planned design using JavaScript, React and VS Code."
    )
    add_body("Main Steps:")
    add_bullet("1. Design the responsive dark-neon application interface.")
    add_bullet("2. Create React components and views.")
    add_bullet("3. Add UI components (Search panel, price slider, cards).")
    add_bullet("4. Write JavaScript and React code.")
    add_bullet("5. Connect components using state and props.")
    add_bullet("6. Implement required shopping and AI features.")
    add_bullet("7. Run and test the application.")
    add_img('extracted_images/p35_img1_108.jpeg', width_in=4.0, caption="Figure 7.2: Application Development Lifecycle")
    add_body(
        "Feature implementation converts project requirements into working functions. It includes user input, navigation, database operations and API integration."
    )
    add_body("Proper design and development make the application functional, user-friendly and easy to use.")

    doc.add_page_break()

    # ==========================================
    # PAGE 36: 7.3 DATABASE & GEMINI API INTEGRATION
    # ==========================================
    add_page_header_number(36)
    add_subheading("7.3 DATABASE & API INTEGRATION")
    add_body(
        "Database and API integration are used to manage and exchange data in a web application. A database stores data locally, while an API allows the application to communicate with external AI services."
    )
    add_body("Database Integration:")
    add_bullet("- Connects the application with browser LocalStorage.")
    add_bullet("- Stores and retrieves shopping cart and user order data.")
    add_bullet("- Supports CRUD operations seamlessly.")
    add_body("API Integration:")
    add_bullet("- Sends shopping prompts to Google Gemini API.")
    add_bullet("- Receives real-time AI recommendations from server.")
    add_bullet("- Processes response text and formats product suggestions.")
    add_bullet("- Displays received recommendations in the Ask Nexa modal.")
    add_img('extracted_images/diagram_gemini_flow.png', width_in=5.0, caption="Figure 7.3: Google Gemini AI Architecture")
    add_body(
        "Database and API integration help web applications manage both local and online data efficiently. During training, LocalStorage operations and API concepts were practiced."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 37: 7.4 TESTING & DEBUGGING
    # ==========================================
    add_page_header_number(37)
    add_subheading("7.4 TESTING & DEBUGGING")
    add_body(
        "Testing and debugging are important steps in web application development. Testing checks whether the application works correctly, while debugging helps to find and fix errors."
    )
    add_subheading("Testing:")
    add_body("Testing is used to check the functionality, UI responsiveness and performance of the web application.")
    add_subheading("Debugging:")
    add_body("Debugging is the process of finding and correcting errors in the code.")
    add_body("Common Errors:")
    add_bullet("- Compilation / syntax errors in JSX")
    add_bullet("- Runtime JavaScript exceptions")
    add_bullet("- UI layout and overflow errors on mobile screens")
    add_bullet("- Storage and API network errors")
    add_body("Basic Process:")
    add_bullet("1. Run the application in browser.")
    add_bullet("2. Identify errors using Chrome DevTools Console.")
    add_bullet("3. Find and fix the cause in VS Code.")
    add_bullet("4. Test the application again.")
    add_body(
        "During training, testing and debugging were practiced to solve errors and improve the working of web applications."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 38: 8. PRODUCTION BUILD & DEPLOYMENT
    # ==========================================
    add_page_header_number(38)
    add_chapter_title("8. Production Build & Deployment")
    add_subheading("8.1 INTRODUCTION TO WEB PRODUCTION BUILD")
    add_body(
        "A Production Build is the optimized, minified bundle of a web application designed for fast, secure and reliable execution on live web servers."
    )
    add_body(
        "A web build contains the compiled HTML, CSS and JavaScript bundles. After successfully building a web project, the generated assets in the 'dist' folder can be hosted on a cloud server or served locally."
    )
    add_body("Uses of Production Build:")
    add_bullet("1. Deploying web applications on cloud platforms (Vercel, Netlify).")
    add_bullet("2. Testing applications across multiple devices and networks.")
    add_bullet("3. Sharing live applications with users and evaluators.")
    add_bullet("4. Delivering maximum performance and minimal download size.")
    add_body(
        "Build generation is an important step because it converts a development project into an installable, high-performance web package."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 39: 8.2 BUILD PROCESS & ASSET BUNDLING
    # ==========================================
    add_page_header_number(39)
    add_subheading("8.2 BUILD PROCESS, BUNDLE GENERATION & OPTIMIZATION")
    add_body(
        "The build process converts a React web project into static production files. Vite uses the Rollup bundler to compile and build the application."
    )
    add_body("Build Generation Steps:")
    add_bullet("1. Open the project in Visual Studio Code.")
    add_bullet("2. Check and fix code errors.")
    add_bullet("3. Open integrated terminal.")
    add_bullet("4. Execute command: npm run build.")
    add_bullet("5. Vite compiles JSX and bundles assets into the 'dist' folder.")
    add_body("Types of Builds:")
    add_bullet("- Development Build: Used during coding with Hot Module Replacement.")
    add_bullet("- Production Build: Final minified version used for distribution and deployment.")
    add_img('extracted_images/p50_img1_150.png', width_in=4.4, caption="Figure 8.2: Asset Compilation & Bundling Pipeline")
    add_body(
        "Thus, build generation converts the completed web project into a deployable distribution package."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 40: 8.3 TESTING BUILD & NGROK DEPLOYMENT
    # ==========================================
    add_page_header_number(40)
    add_subheading("8.3 TESTING PRODUCTION BUILD & APPLICATION DEPLOYMENT")
    add_body(
        "After generating a production build, it can be previewed locally and deployed using ngrok tunneling to test the completed application on real smartphones and tablets."
    )
    add_body("Steps for Testing and Deploying:")
    add_bullet("1. Generate production build using 'npm run build'.")
    add_bullet("2. Test build locally using 'npm run preview'.")
    add_bullet("3. Launch ngrok tunnel: ngrok http 5175.")
    add_bullet("4. Open the public HTTPS URL on a smartphone device.")
    add_bullet("5. Check all screens, navigation and features.")
    add_bullet("6. Test user search, Ask Nexa chat, cart and checkout.")
    add_bullet("7. Verify mobile responsive centering and touch responsiveness.")
    add_bullet("8. Test the application again after making final adjustments.")
    add_body(
        "Production testing helps to check the functionality, user interface, performance and stability of the application. It also ensures that the application is ready for final deployment."
    )
    add_body(
        "During training, production building and testing were practiced to understand how a developed web application can be tested across multiple devices."
    )

    doc.add_page_break()

    # ==========================================
    # PAGES 41 TO 50: PHASE 9 (PRACTICALS 9.1 to 9.9)
    # ==========================================
    practicals_pages = [
        (41, "9.Practicals\n9.1 VISUAL STUDIO CODE SETUP PRACTICAL",
         "To install and configure Visual Studio Code for web and AI application development.",
         "- Computer/Laptop\n- Visual Studio Code Installer\n- Node.js & npm\n- Internet Connection",
         "Procedure:",
         "1. Download and install Visual Studio Code.\n2. Configure the required Node.js and npm runtime.\n3. Install recommended web extensions (ESLint, Prettier, React snippets).\n4. Configure integrated PowerShell terminal.\n5. Create a sample web project.\n6. Run the project to check the setup.",
         "Result:",
         "Visual Studio Code was successfully installed and configured for web application development.",
         'extracted_images/p41_img1_123.png', 42),

        (43, "9.2 REACT PROJECT CREATION PRACTICAL",
         "To create a basic React project using Vite in Visual Studio Code.",
         "- Computer/Laptop\n- Visual Studio Code\n- Node.js & npm\n- Web Browser",
         "Procedure:\n1. Open Visual Studio Code.\n2. Open Integrated Terminal.\n3. Execute 'npm create vite@latest my-app -- --template react'.\n4. Enter the project name.\n5. Select JavaScript as the language.\n6. Run 'npm install' to install dependencies.\n7. Run 'npm run dev' to start the local development server.\n8. View the application in the web browser.",
         "", "",
         "Result:\nA basic React web project was successfully created and executed using Visual Studio Code and Vite.",
         'extracted_images/p43_img1_128.jpeg', None),

        (44, "9.3 JAVASCRIPT PROGRAMMING PRACTICAL",
         "To perform basic programming operations using modern JavaScript (ES6+).",
         "- Computer/Laptop\n- Visual Studio Code\n- Node.js Runtime",
         "Procedure:\n1. Open a web project in Visual Studio Code.\n2. Create or open a JavaScript file.\n3. Declare variables using 'let' and 'const'.\n4. Use different data types (Numbers, Strings, Objects, Arrays).\n5. Perform arithmetic and logical operations.\n6. Use conditional statements and loops.\n7. Create and call arrow functions.\n8. Run the program and check the output in the console.",
         "", "",
         "Result:\nBasic JavaScript programming concepts were successfully implemented and tested in Visual Studio Code.",
         'extracted_images/p44_img1_131.jpeg', None),

        (45, "9.4 REACT HOOKS & STATE PRACTICAL",
         "To manage component state and perform side-effect operations using React Hooks.",
         "- Computer/Laptop\n- Visual Studio Code\n- React Project",
         "Procedure:\n1. Create a new React component.\n2. Import 'useState' and 'useEffect' from 'react'.\n3. Declare reactive state variables for cart items.\n4. Add interactive buttons to modify state.\n5. Implement useEffect to synchronize data with LocalStorage.\n6. Pass props between components.\n7. Run the application and test reactive state updates.",
         "", "",
         "Result:\nReact Hooks and state management were successfully implemented and tested in the web application.",
         'extracted_images/p45_img1_134.png', None),

        (46, "9.5 UI DESIGN PRACTICAL",
         "To design a responsive and user-friendly dark neon web application interface.",
         "- Computer/Laptop\n- Visual Studio Code\n- CSS3 Stylesheet\n- Browser DevTools",
         "Procedure:\n1. Open the project in Visual Studio Code.\n2. Define CSS variables for dark background and neon violet/cyan colors.\n3. Use CSS Grid for the product catalog layout.\n4. Use Flexbox for navigation, headers and buttons.\n5. Add glowing hover transitions and badge indicators.\n6. Run the application and check responsiveness in browser.",
         "", "",
         "Result:\nA modern and user-friendly dark neon web application interface was successfully designed and tested.",
         'extracted_images/p46_img1_137.jpeg', None),

        (47, "9.6 LOCALSTORAGE & CRUD OPERATIONS PRACTICAL",
         "To create a client-side database and perform basic CRUD operations in a web application.",
         "- Computer/Laptop\n- Visual Studio Code\n- LocalStorage API",
         "Procedure:\n1. Create a 'storage.js' utility module.\n2. Create a LocalStorage database for cart items.\n3. Insert records into storage using setItem.\n4. Display stored records using getItem.\n5. Update an existing quantity record.\n6. Delete an unwanted record from storage.\n7. Test all operations in the application.",
         "", "",
         "Result:\nA LocalStorage database was successfully created and CRUD operations were performed in the web application.",
         'extracted_images/p47_img1_141.jpeg', None),

        (48, "9.7 GEMINI AI INTEGRATION PRACTICAL",
         "To integrate Google Gemini AI API with a web application and display AI shopping recommendations.",
         "- Computer/Laptop\n- Visual Studio Code\n- Google Gemini API Key\n- Internet Connection",
         "Procedure:\n1. Open the project in Visual Studio Code.\n2. Configure Google Gemini API key in .env file.\n3. Create an asynchronous function using fetch.\n4. Send user shopping questions as prompts.\n5. Receive the response from the Gemini server.\n6. Process the response text.\n7. Display received recommendations in Ask Nexa modal.\n8. Run and test the AI chat functionality.",
         "", "",
         "Result:\nThe Gemini AI API was successfully integrated with the web application and real-time recommendations were displayed.",
         'extracted_images/p48_img1_144.jpeg', None),

        (49, "9.8 DEBUGGING PRACTICAL",
         "To identify and fix errors in a web application using Visual Studio Code and Chrome DevTools.",
         "- Computer/Laptop\n- Visual Studio Code\n- Google Chrome DevTools",
         "Procedure:\n1. Open the web project in Visual Studio Code.\n2. Run the application and identify the error.\n3. Check source code and error messages in the Console.\n4. Use DevTools Elements and Network tabs to find the cause.\n5. Correct the code or configuration in VS Code.\n6. Run the application again.\n7. Verify that the error is resolved.",
         "", "",
         "Result:\nErrors in the web application were successfully identified, corrected and tested.",
         'extracted_images/p49_img1_147.jpeg', None),

        (50, "9.9 PRODUCTION BUILD PRACTICAL",
         "To generate an optimized production build of a web application using Vite in Visual Studio Code.",
         "- Computer/Laptop\n- Visual Studio Code\n- Vite Build Tool",
         "Procedure:\n1. Open the completed web project.\n2. Check and fix project errors.\n3. Select the integrated terminal.\n4. Run command 'npm run build'.\n5. Wait for the build process to complete.\n6. Locate the generated 'dist' folder.\n7. Test the production build using 'npm run preview'.",
         "", "",
         "Result:\nThe production web build was successfully generated and tested on a web server.",
         'extracted_images/p50_img1_150.png', None),
    ]

    for pno, title, aim, req, proc_label, proc_text, res_label, res_text, img_p, pno2 in practicals_pages:
        add_page_header_number(pno)
        add_chapter_title(title)
        add_subheading("Aim:")
        add_body(aim)
        if img_p and pno in (41,):
            add_img(img_p, width_in=3.8)
        add_subheading("Requirements:")
        for line in req.split('\n'):
            if line.strip():
                add_bullet(line.strip())
        
        if pno2: # split practical 9.1 into 2 pages like original
            doc.add_page_break()
            add_page_header_number(pno2)
            add_subheading(proc_label)
            for line in proc_text.split('\n'):
                if line.strip():
                    add_body(line.strip())
            add_subheading(res_label)
            add_body(res_text)
            doc.add_page_break()
        else:
            if proc_text:
                add_subheading("Procedure:")
                for line in proc_text.split('\n'):
                    if line.strip():
                        add_body(line.strip())
            if img_p:
                add_img(img_p, width_in=3.8)
            add_subheading("Result:")
            add_body(res_text.replace("Result:\n", ""))
            doc.add_page_break()

    # ==========================================
    # PAGES 51 TO 54: PHASE 10 (PROJECT DEVELOPMENT)
    # ==========================================
    # Page 51: 10.1 Overview & Objective
    add_page_header_number(51)
    add_chapter_title("10. Project Development")
    add_subheading("10.1 PROJECT OVERVIEW & OBJECTIVE")
    add_body(
        "During the In-Plant Training, I learned Web Development, JavaScript programming, React.js and LocalStorage database concepts. Using this knowledge, I developed a capstone project called AI Shopping Assistant (Nexa Cart)."
    )
    add_body(
        "AI Shopping Assistant is a modern web application used to discover, compare and purchase products with the help of Artificial Intelligence. It provides a simple, dark neon interface for storing cart items, exploring catalogs and receiving personalized AI recommendations."
    )
    add_body("Objectives:")
    add_bullet("1. To develop a responsive web application using React.js and Vite.")
    add_bullet("2. To provide smart shopping recommendations using Google Gemini AI.")
    add_bullet("3. To manage cart and order details using browser LocalStorage.")
    add_bullet("4. To apply the concepts learned during training.")
    add_bullet("5. To gain practical experience in modern web and AI development.")
    add_body("The project helped me apply my training knowledge to a practical application.")
    add_img('extracted_images/report_screen_chat.png', width_in=4.4, caption="Figure 10.1: Interactive Ask Nexa AI Assistant")

    doc.add_page_break()

    # Page 52: 10.2 Requirements & Technologies Used
    add_page_header_number(52)
    add_subheading("10.2 REQUIREMENTS & TECHNOLOGIES USED")
    add_body(
        "The AI Shopping Assistant application was developed using the concepts and technologies learned during the In-Plant Training."
    )
    add_body("Hardware Requirements")
    add_bullet("- Computer/Laptop")
    add_bullet("- Minimum 4 GB RAM")
    add_bullet("- Sufficient storage space")
    add_body("Software Requirements")
    add_bullet("- Visual Studio Code")
    add_bullet("- Node.js & npm")
    add_bullet("- Google Chrome Web Browser")
    add_bullet("- HTML5 LocalStorage")
    add_body("Technologies Used")
    add_body("JavaScript (ES6+) & React: Used to write application logic and implement responsive UI components.")
    add_body("Visual Studio Code: Used for coding, designing, building and testing the application.")
    add_body("Google Gemini API: Used to provide real-time conversational shopping recommendations.")
    add_body("LocalStorage: Used to store and manage cart and order records locally.")
    add_img('extracted_images/report_screen_home.png', width_in=5.0, caption="Figure 10.2: AI Shopping Assistant Homepage UI")

    doc.add_page_break()

    # Page 53: 10.3 Project Features & Working
    add_page_header_number(53)
    add_subheading("10.3 PROJECT FEATURES & WORKING")
    add_body(
        "The AI Shopping Assistant application is designed to help users shop smart and manage their purchasing activities in a simple and organized way."
    )
    add_body("Main Features:")
    add_bullet("1. Ask Nexa AI: Allows users to get instant budget-aware recommendations.")
    add_bullet("2. Product Catalog: Displays 100+ products across smartphones, laptops and wearables.")
    add_bullet("3. Price Range Filter: Allows users to set price limits from ₹1 to ₹2,00,000.")
    add_bullet("4. Cart & Wishlist: Displays and manages selected shopping items dynamically.")
    add_bullet("5. Compare Matrix: Provides side-by-side specification comparison of 3 products.")
    add_bullet("6. Bilingual Support: Allows switching between English and Marathi languages.")
    add_bullet("7. Admin Dashboard: Helps track inventory, stock and sales revenue.")
    add_subheading("Working")
    add_body(
        "The user opens the application and accesses the catalog. Users can filter by category or price, compare products, and ask Nexa AI for advice. From the cart, the user can proceed to checkout with Cash on Delivery and track placed orders."
    )
    add_img('extracted_images/report_screen_catalog.png', width_in=5.0, caption="Figure 10.3: Product Catalog & Price Filtering")

    doc.add_page_break()

    # Page 54: 10.4 Database, Testing & Results
    add_page_header_number(54)
    add_subheading("10.4 DATABASE, TESTING & RESULTS")
    add_body(
        "The AI Shopping Assistant application uses LocalStorage to store and manage shopping information such as cart items, wishlists, orders and custom products."
    )
    add_subheading("Database")
    add_body(
        "LocalStorage is used for local data storage. It helps to insert, retrieve, update and delete the required records."
    )
    add_subheading("Testing")
    add_body("The application was tested to check the working of its main features.")
    add_bullet("- User search and price range filtering")
    add_bullet("- Ask Nexa AI chat and recommendations")
    add_bullet("- Add to Cart, Remove from Cart and Buy Now")
    add_bullet("- Product comparison table")
    add_bullet("- Checkout with Cash on Delivery")
    add_bullet("- Multi-language English and Marathi toggle")
    add_bullet("- LocalStorage data persistence")
    add_bullet("- Responsive layout on mobile and desktop")
    add_body("Errors found during testing were identified and corrected using VS Code and Chrome DevTools.")
    add_img('extracted_images/report_screen_marathi.png', width_in=5.0, caption="Figure 10.4: Bilingual Marathi Interface Mode")
    add_subheading("Results")
    add_body(
        "The AI Shopping Assistant application was successfully developed and tested. The main features worked according to the requirements and the application provided a simple way to manage shopping with Artificial Intelligence."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 55: CONCLUSION
    # ==========================================
    add_page_header_number(55)
    add_chapter_title("CONCLUSION")
    add_body(
        "The In-Plant Training in Artificial Intelligence & Web Application Development provided valuable practical knowledge and experience in modern software engineering. During the training, I learned Visual Studio Code, JavaScript (ES6+), React.js, React Hooks, UI design, LocalStorage database, CRUD operations, Google Gemini AI API integration, testing, debugging and production build generation."
    )
    add_body(
        "The practical sessions helped me understand the complete process of developing a modern web application. Using the knowledge gained during training, I developed a capstone project named AI Shopping Assistant (Nexa Cart), which helped me apply concepts such as React.js, VS Code, LocalStorage and Gemini AI in a practical application."
    )
    add_body(
        "Overall, the training improved my technical skills, problem-solving ability and understanding of Artificial Intelligence and web application development. It also provided practical exposure to the software development process and increased my confidence in developing modern web applications."
    )

    doc.add_page_break()

    # ==========================================
    # PAGE 56: ACKNOWLEDGEMENT
    # ==========================================
    add_page_header_number(56)
    add_chapter_title("ACKNOWLEDGEMENT")
    add_body(
        "I would like to express my sincere gratitude to Indradeep Information Technology Pvt. Ltd., Satara for providing me the opportunity to complete my In-Plant Training in Artificial Intelligence & Web Application Development."
    )
    add_body(
        "I am especially thankful to Mr. Mahesh Kumar Lakade Sir, CEO, for providing valuable guidance, support and encouragement throughout the training. I am also thankful to my mentor Mr. Vaibhav Limbkar Sir for his continuous guidance and technical support during the training."
    )
    add_body(
        "I am grateful to Mr. Shubham Sir and all the staff members for their cooperation and support. I also thank my college faculty for their valuable guidance and motivation during the training and preparation of this report."
    )
    add_body(
        "Finally, I would like to thank everyone who directly or indirectly helped me in successfully completing my In-Plant Training and developing my capstone project AI Shopping Assistant."
    )
    
    p_ack_sign = doc.add_paragraph()
    p_ack_sign.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_ack_sign.paragraph_format.space_before = Pt(30)
    r = p_ack_sign.add_run("Sharvari Prashant Pawar\nDiploma in Computer Engineering\nArvind Gavali College of Engineering, Satara")
    r.bold = True

    doc.add_page_break()

    # ==========================================
    # PAGE 57: REFERENCES
    # ==========================================
    add_page_header_number(57)
    add_chapter_title("REFERENCES")
    add_body(
        "The following resources were referred to during the study and preparation of this In-Plant Training Report:"
    )
    add_bullet("1. Visual Studio Code Documentation – Code editing, extensions, integrated terminal and debugging guidelines.")
    add_bullet("2. React.js Documentation – Component architecture, JSX syntax, hooks and state management concepts.")
    add_bullet("3. Vite Documentation – Fast development server, bundling, Hot Module Replacement and production builds.")
    add_bullet("4. Google Gemini AI API Documentation – Generative AI endpoints, prompt formatting and REST integration.")
    add_bullet("5. Training Notes – Notes and practical concepts provided during the In-Plant Training at Indradeep IT.")
    add_bullet("6. Practical Programs – Programs and examples developed during the Web & AI Development training.")
    add_bullet("7. Project Work – Practical knowledge and concepts applied while developing the AI Shopping Assistant project.")

    # Save document
    docx_path = "c:/Users/mahan/OneDrive/Desktop/Ai shopping Assistant/SHARVARI_PAWAR_REPORT_EXACT_57_PAGES.docx"
    doc.save(docx_path)
    print(f"Exact 57-page report saved to {docx_path}")

    # Copy to Desktop and convert to PDF
    import shutil, win32com.client
    desktop_docx = "c:/Users/mahan/OneDrive/Desktop/SHARVARI PAWAR INDUSTRIAL TRAINING REPORT FINAL.docx"
    desktop_pdf = "c:/Users/mahan/OneDrive/Desktop/SHARVARI PAWAR INDUSTRIAL TRAINING REPORT FINAL.pdf"
    
    shutil.copyfile(docx_path, desktop_docx)
    print("Copied updated docx to Desktop")
    
    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    wdoc = word.Documents.Open(os.path.abspath(desktop_docx))
    wdoc.SaveAs(os.path.abspath(desktop_pdf), FileFormat=17) # 17 = wdFormatPDF
    wdoc.Close()
    word.Quit()
    print("Converted to FINAL PDF on Desktop with page numbers at bottom!")

build_report()


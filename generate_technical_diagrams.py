import os
from PIL import Image, ImageDraw, ImageFont

def get_font(size, bold=False, mono=False):
    font_name = "consola.ttf" if mono else ("segoeuib.ttf" if bold else "segoeui.ttf")
    try:
        return ImageFont.truetype(font_name, size)
    except:
        try:
            fallback = "arialbd.ttf" if bold else "arial.ttf"
            return ImageFont.truetype(fallback, size)
        except:
            return ImageFont.load_default()

def draw_header(draw, title, subtitle, width=1200):
    # Header background gradient bar
    draw.rectangle([0, 0, width, 85], fill="#0f172a")
    draw.rectangle([0, 85, width, 88], fill="#3b82f6") # accent stripe
    f_title = get_font(26, bold=True)
    f_sub = get_font(15, bold=False)
    draw.text((35, 18), title, fill="#ffffff", font=f_title)
    draw.text((35, 54), subtitle, fill="#94a3b8", font=f_sub)

def create_timeline():
    w, h = 1200, 620
    im = Image.new("RGB", (w, h), "#f8fafc")
    draw = ImageDraw.Draw(im)
    draw_header(draw, "EVOLUTION OF WEB & FRONTEND TECHNOLOGIES (1991 - 2026)", 
                "From Static Hypertext to Modern AI-Powered Single Page Applications")
    
    # Timeline line
    draw.line([(60, 320), (1140, 320)], fill="#94a3b8", width=6)
    
    milestones = [
        ("1991", "HTML 1.0", "Tim Berners-Lee\nStatic Web Pages\nHypertext Links", "#0284c7", True),
        ("1995", "JavaScript", "Brendan Eich\nDynamic Scripts\nClient Interactivity", "#d97706", False),
        ("1996", "CSS 1.0", "Cascading Styles\nVisual Layouts\nSeparation of Concerns", "#2563eb", True),
        ("2008", "Google V8", "Fast JIT Compiler\nModern Browsers\nChrome Engine", "#16a34a", False),
        ("2013", "React.js", "Virtual DOM Engine\nComponent Paradigm\nDeclarative UI", "#0891b2", True),
        ("2015", "ES6 Standards", "Arrow Functions\nPromises & Classes\nModern JavaScript", "#ea580c", False),
        ("2020", "Vite Tooling", "Instant Dev Server\nES Modules & Rollup\nRapid Bundling", "#7c3aed", True),
        ("2024-26", "Generative AI", "Gemini 2.0 Integration\nIntelligent Agent\nNexa AI Assistant", "#db2777", False),
    ]
    
    f_year = get_font(18, bold=True)
    f_name = get_font(16, bold=True)
    f_desc = get_font(13, bold=False)
    
    step_x = 135
    for i, (year, name, desc, color, is_top) in enumerate(milestones):
        cx = 90 + i * step_x
        # Node circle
        draw.ellipse([cx-14, 320-14, cx+14, 320+14], fill=color, outline="#ffffff", width=3)
        
        # Connector
        if is_top:
            card_y1 = 120
            card_y2 = 270
            draw.line([(cx, 270), (cx, 306)], fill=color, width=3)
        else:
            card_y1 = 370
            card_y2 = 520
            draw.line([(cx, 334), (cx, 370)], fill=color, width=3)
            
        # Card box
        bx1 = cx - 60
        bx2 = cx + 60
        draw.rounded_rectangle([bx1, card_y1, bx2, card_y2], radius=10, fill="#ffffff", outline=color, width=2)
        # Year banner
        draw.rounded_rectangle([bx1, card_y1, bx2, card_y1+34], radius=8, fill=color)
        draw.text((bx1+12, card_y1+7), year, fill="#ffffff", font=f_year)
        # Name & desc
        draw.text((bx1+8, card_y1+42), name, fill="#0f172a", font=f_name)
        draw.text((bx1+8, card_y1+72), desc, fill="#475569", font=f_desc)
        
    os.makedirs("extracted_images", exist_ok=True)
    im.save("extracted_images/diagram_web_timeline.png")
    print("Generated diagram_web_timeline.png")

def create_react_lifecycle():
    w, h = 1200, 640
    im = Image.new("RGB", (w, h), "#f8fafc")
    draw = ImageDraw.Draw(im)
    draw_header(draw, "REACT COMPONENT LIFECYCLE & STATE FLOW ARCHITECTURE", 
                "Declarative UI Rendering with React 19 Hooks and Virtual DOM Reconciliation")
    
    phases = [
        ("1. MOUNTING PHASE", "#0284c7", [
            ("Component Initialized", "React parses JSX tree & initiates component scope"),
            ("useState Initial State", "products=[], theme='dark', cart=[] loaded"),
            ("Virtual DOM Render", "JSX converted to lightweight Virtual DOM representation"),
            ("Real DOM Insertion", "Browser renders initial HTML elements & UI layout"),
            ("useEffect(() => {}, [])", "Runs once on mount: loads catalog data & saved preferences")
        ], 60),
        ("2. UPDATING PHASE", "#16a34a", [
            ("State / Props Change", "User applies filter, searches query, or adds item to cart"),
            ("Setter Invocation", "setProducts(), setCart(), or setSearch() triggered"),
            ("Virtual DOM Diffing", "React compares new Virtual DOM tree against previous tree"),
            ("Targeted Real DOM Patch", "Only modified nodes updated (efficient sub-millisecond paint)"),
            ("useEffect(() => {}, [deps])", "Triggers side effects for updated dependencies")
        ], 430),
        ("3. UNMOUNTING PHASE", "#dc2626", [
            ("Component Teardown", "Modal closed, route change, or component unmounted"),
            ("Cleanup Function Executed", "return () => { ... } runs inside useEffect"),
            ("Resource De-allocation", "Timers cleared, event listeners detached, memory freed"),
            ("DOM Node Removal", "React cleanly removes element subtree from real DOM"),
            ("State Destruction", "Local component state safely discarded")
        ], 800),
    ]
    
    f_phase = get_font(18, bold=True)
    f_item_t = get_font(14, bold=True)
    f_item_d = get_font(12, bold=False)
    
    for title, color, steps, bx in phases:
        bw = 340
        # Main container
        draw.rounded_rectangle([bx, 110, bx+bw, 590], radius=12, fill="#ffffff", outline=color, width=3)
        # Phase header
        draw.rounded_rectangle([bx, 110, bx+bw, 160], radius=10, fill=color)
        draw.text((bx+20, 122), title, fill="#ffffff", font=f_phase)
        
        # Step cards
        sy = 175
        for st_title, st_desc in steps:
            draw.rounded_rectangle([bx+12, sy, bx+bw-12, sy+70], radius=8, fill="#f1f5f9", outline="#cbd5e1", width=1)
            draw.text((bx+22, sy+8), st_title, fill="#0f172a", font=f_item_t)
            draw.text((bx+22, sy+32), st_desc, fill="#475569", font=f_item_d)
            sy += 80
            
    im.save("extracted_images/diagram_react_lifecycle.png")
    print("Generated diagram_react_lifecycle.png")

def create_crud_localstorage():
    w, h = 1200, 620
    im = Image.new("RGB", (w, h), "#f8fafc")
    draw = ImageDraw.Draw(im)
    draw_header(draw, "CLIENT-SIDE STORAGE & CRUD OPERATIONS ARCHITECTURE", 
                "Nexa AI Shopping Assistant LocalStorage & JSON State Persistence Flow")
    
    crud_ops = [
        ("CREATE (C)", "Add Item to Cart / Place Order", "#059669", 
         "const handleAddToCart = (product) => {\n  const updated = [...cart, { ...product, qty: 1 }];\n  setCart(updated);\n  localStorage.setItem('cart', JSON.stringify(updated));\n};",
         "Saves new order or cart entity into browser persistent storage.", 60, 120),
        ("READ (R)", "Load Catalog, Cart & Preferences", "#0284c7", 
         "useEffect(() => {\n  const savedCart = localStorage.getItem('cart');\n  if (savedCart) setCart(JSON.parse(savedCart));\n  const savedTheme = localStorage.getItem('theme');\n  if (savedTheme) setTheme(savedTheme);\n}, []);",
         "Retrieves saved JSON records on application initialization.", 620, 120),
        ("UPDATE (U)", "Modify Quantity & Preferences", "#d97706", 
         "const handleUpdateQty = (id, delta) => {\n  const updated = cart.map(item =>\n    item.id === id ? { ...item, qty: item.qty + delta } : item\n  );\n  setCart(updated);\n  localStorage.setItem('cart', JSON.stringify(updated));\n};",
         "Updates existing product quantity, filter settings, or active theme.", 60, 360),
        ("DELETE (D)", "Remove Item & Clear Orders", "#dc2626", 
         "const handleRemoveItem = (id) => {\n  const filtered = cart.filter(item => item.id !== id);\n  setCart(filtered);\n  localStorage.setItem('cart', JSON.stringify(filtered));\n};\n// Clear: localStorage.removeItem('cart');",
         "Removes entity by ID or clears stored collections on reset.", 620, 360),
    ]
    
    f_op = get_font(18, bold=True)
    f_sub = get_font(14, bold=True)
    f_code = get_font(12, mono=True)
    f_desc = get_font(12, bold=False)
    
    for op, title, color, code, desc, x, y in crud_ops:
        bw, bh = 520, 215
        draw.rounded_rectangle([x, y, x+bw, y+bh], radius=10, fill="#ffffff", outline=color, width=2)
        # Title bar
        draw.rounded_rectangle([x, y, x+bw, y+38], radius=8, fill=color)
        draw.text((x+15, y+8), f"{op} : {title}", fill="#ffffff", font=f_op)
        # Code box
        draw.rounded_rectangle([x+10, y+46, x+bw-10, y+175], radius=6, fill="#0f172a")
        draw.text((x+18, y+52), code, fill="#38bdf8", font=f_code)
        # Note
        draw.text((x+15, y+185), f"Note: {desc}", fill="#475569", font=f_desc)
        
    im.save("extracted_images/diagram_crud_localstorage.png")
    print("Generated diagram_crud_localstorage.png")

def create_web_dev_lifecycle():
    w, h = 1200, 640
    im = Image.new("RGB", (w, h), "#f8fafc")
    draw = ImageDraw.Draw(im)
    draw_header(draw, "WEB & AI APPLICATION DEVELOPMENT LIFECYCLE (SDLC)", 
                "Systematic Engineering Phases of Nexa AI Shopping Assistant")
    
    steps = [
        ("1. Requirement Analysis", "#0284c7", "• Define 300+ product catalog scope\n• Multi-language UI (Marathi/English)\n• Budget filtering up to Rs. 4,00,000\n• AI shopping chatbot specification"),
        ("2. System & UI/UX Design", "#0891b2", "• Responsive glassmorphism layout\n• Flipkart/Amazon 4-angle gallery\n• Theme switching (Dark/Light mode)\n• Component hierarchy planning"),
        ("3. Frontend Architecture", "#2563eb", "• React 19 Single Page App structure\n• Lucide-react iconography\n• Custom CSS animations & modals\n• Modular components separation"),
        ("4. Gemini AI Engine", "#7c3aed", "• Google Gemini 1.5/2.0 API integration\n• Natural language product reasoning\n• Bilingual prompt engineering\n• Direct product link generation"),
        ("5. State & Data Layer", "#ea580c", "• Real product datasets with specs\n• Client-side CRUD with LocalStorage\n• Category, price & gender filters\n• Cart persistence & order tracking"),
        ("6. Testing & Deployment", "#16a34a", "• Chrome DevTools inspection\n• Mobile & cross-browser testing\n• Vite & Rollup production build\n• GitHub version control & release"),
    ]
    
    f_st = get_font(16, bold=True)
    f_desc = get_font(13, bold=False)
    
    cols = 3
    for i, (title, color, text) in enumerate(steps):
        r = i // cols
        c = i % cols
        bx = 60 + c * 380
        by = 120 + r * 250
        bw, bh = 340, 220
        
        draw.rounded_rectangle([bx, by, bx+bw, by+bh], radius=10, fill="#ffffff", outline=color, width=2)
        draw.rounded_rectangle([bx, by, bx+bw, by+42], radius=8, fill=color)
        draw.text((bx+15, by+10), title, fill="#ffffff", font=f_st)
        draw.text((bx+18, by+56), text, fill="#334155", font=f_desc)
        
    im.save("extracted_images/diagram_web_dev_lifecycle.png")
    print("Generated diagram_web_dev_lifecycle.png")

def create_vite_build_pipeline():
    w, h = 1200, 600
    im = Image.new("RGB", (w, h), "#f8fafc")
    draw = ImageDraw.Draw(im)
    draw_header(draw, "VITE & ROLLUP ASSET COMPILATION & BUNDLING PIPELINE", 
                "From Modular JSX Source Code to Highly Optimized Production Distribution")
    
    stages = [
        ("SOURCE ASSETS", "#0284c7", ["main.jsx (React 19)", "styles.css (Styles)", "data/ (300 Models)", "Assets / Icons"], 60),
        ("ESBUILD COMPILER", "#ea580c", ["JSX -> Plain JS", "Fast Go Transpiler", "TypeScript / Modern JS", "10x - 100x Faster"], 340),
        ("ROLLUP BUNDLER", "#7c3aed", ["Tree-Shaking Elimination", "Dynamic Code Splitting", "Chunk File Hashing", "CSS Minification"], 620),
        ("DIST / PRODUCTION", "#16a34a", ["index.html (Host)", "index-[hash].js (<150KB)", "index-[hash].css (<25KB)", "Optimized for CDN"], 900),
    ]
    
    f_st = get_font(16, bold=True)
    f_it = get_font(13, bold=False)
    
    for title, color, items, bx in stages:
        bw = 240
        draw.rounded_rectangle([bx, 140, bx+bw, 520], radius=10, fill="#ffffff", outline=color, width=2)
        draw.rounded_rectangle([bx, 140, bx+bw, 190], radius=8, fill=color)
        draw.text((bx+15, 153), title, fill="#ffffff", font=f_st)
        
        sy = 215
        for item in items:
            draw.rounded_rectangle([bx+12, sy, bx+bw-12, sy+55], radius=6, fill="#f1f5f9", outline="#cbd5e1", width=1)
            draw.text((bx+20, sy+16), item, fill="#1e293b", font=f_it)
            sy += 75
            
        # Draw connector arrow
        if bx < 900:
            ax = bx + bw + 10
            draw.line([(ax, 330), (ax+30, 330)], fill="#64748b", width=4)
            draw.polygon([(ax+35, 330), (ax+25, 323), (ax+25, 337)], fill="#64748b")
            
    im.save("extracted_images/diagram_vite_build_pipeline.png")
    print("Generated diagram_vite_build_pipeline.png")

def create_vscode_setup():
    w, h = 1200, 600
    im = Image.new("RGB", (w, h), "#f8fafc")
    draw = ImageDraw.Draw(im)
    draw_header(draw, "PRACTICAL 9.1: VISUAL STUDIO CODE SETUP & WORKFLOW", 
                "Configuring Modern IDE Environment for React, Vite & Generative AI")
    
    panels = [
        ("1. Node.js & Runtime", "#059669", 
         "• Node.js v20+ LTS Installed\n• npm (Node Package Manager)\n• Execution environment for Vite\n• Terminal: node -v && npm -v"),
        ("2. VS Code Extensions", "#0284c7", 
         "• ES7+ React/Redux Snippets\n• Prettier - Code Formatter\n• ESLint - Static Code Analysis\n• Tailwind CSS IntelliSense"),
        ("3. Integrated Terminal", "#7c3aed", 
         "• PowerShell & Bash inside IDE\n• npm run dev (Local Server)\n• git add, commit, push CLI\n• Process monitoring & logs"),
        ("4. Dev Workspace", "#d97706", 
         "• Multi-tab split editor\n• Integrated Git source control\n• Settings & Keyboard shortcuts\n• Chrome DevTools debugging"),
    ]
    
    f_p = get_font(17, bold=True)
    f_t = get_font(14, bold=False)
    
    for i, (title, color, text) in enumerate(panels):
        bx = 60 + i * 275
        bw = 255
        draw.rounded_rectangle([bx, 130, bx+bw, 530], radius=10, fill="#ffffff", outline=color, width=2)
        draw.rounded_rectangle([bx, 130, bx+bw, 180], radius=8, fill=color)
        draw.text((bx+15, 145), title, fill="#ffffff", font=f_p)
        draw.text((bx+16, 210), text, fill="#334155", font=f_t)
        
    im.save("extracted_images/diagram_vscode_setup.png")
    print("Generated diagram_vscode_setup.png")

def create_vite_project_creation():
    w, h = 1200, 600
    im = Image.new("RGB", (w, h), "#f8fafc")
    draw = ImageDraw.Draw(im)
    draw_header(draw, "PRACTICAL 9.2: REACT PROJECT CREATION VIA VITE CLI", 
                "Scaffolding Modern Single Page Application with Modular Directory Layout")
    
    # Left command box
    draw.rounded_rectangle([60, 120, 560, 540], radius=10, fill="#0f172a", outline="#3b82f6", width=2)
    draw.rounded_rectangle([60, 120, 560, 165], radius=8, fill="#1e293b")
    draw.text((80, 132), "Terminal Scaffolding Commands", fill="#ffffff", font=get_font(16, bold=True))
    
    cmds = (
        "# 1. Initialize project with React template\n"
        "npm create vite@latest ai-shopping-assistant -- --template react\n\n"
        "# 2. Navigate into project directory\n"
        "cd \"ai-shopping-assistant\"\n\n"
        "# 3. Install core dependencies\n"
        "npm install\n"
        "npm install lucide-react @google/genai\n\n"
        "# 4. Launch blazing-fast development server\n"
        "npm run dev\n\n"
        "> VITE v6.4 ready in 250ms at http://localhost:5173/"
    )
    draw.text((80, 185), cmds, fill="#38bdf8", font=get_font(13, mono=True))
    
    # Right directory tree box
    draw.rounded_rectangle([600, 120, 1140, 540], radius=10, fill="#ffffff", outline="#64748b", width=2)
    draw.rounded_rectangle([600, 120, 1140, 165], radius=8, fill="#334155")
    draw.text((620, 132), "Standard Vite + React Directory Architecture", fill="#ffffff", font=get_font(16, bold=True))
    
    tree = (
        "ai-shopping-assistant/\n"
        "├── 📁 node_modules/         (Installed npm packages)\n"
        "├── 📁 public/               (Static assets, icons & logos)\n"
        "├── 📁 src/\n"
        "│   ├── 📁 data/             (300 Models & specs catalog)\n"
        "│   ├── 📄 main.jsx          (React entrypoint & state logic)\n"
        "│   └── 🎨 styles.css        (Glassmorphism & animations)\n"
        "├── 📄 index.html            (Single-page HTML root host)\n"
        "├── 📄 package.json          (Dependencies & build scripts)\n"
        "├── 📄 vite.config.js        (Vite server & build settings)\n"
        "└── 📄 .env                  (Gemini API secret keys)"
    )
    draw.text((625, 185), tree, fill="#0f172a", font=get_font(14, mono=True))
    
    im.save("extracted_images/diagram_vite_project_creation.png")
    print("Generated diagram_vite_project_creation.png")

def create_javascript_es6():
    w, h = 1200, 620
    im = Image.new("RGB", (w, h), "#f8fafc")
    draw = ImageDraw.Draw(im)
    draw_header(draw, "PRACTICAL 9.3: MODERN JAVASCRIPT (ES6+) PROGRAMMING PARADIGMS", 
                "Essential ECMAScript Features Utilized in Nexa AI Shopping Assistant")
    
    es6_blocks = [
        ("1. Arrow Functions & Lexical Scope", "#0284c7",
         "const filterByPrice = (items, maxPrice) => {\n  return items.filter(item => item.price <= maxPrice);\n};",
         "Concise function syntax with implicit returns and lexical this binding."),
        ("2. Destructuring & Spread Syntax", "#059669",
         "const { title, price, category } = product;\nconst updatedCart = [...prevCart, { ...product, qty: 1 }];",
         "Clean object unpacking and immutable state updates without mutations."),
        ("3. Higher-Order Array Methods", "#7c3aed",
         "const totalCartPrice = cart.reduce(\n  (acc, item) => acc + item.price * item.qty, 0\n);\nconst searchMatches = catalog.filter(p => p.name.includes(q));",
         "Declarative data processing: map(), filter(), reduce(), and find()."),
        ("4. Async / Await & Promises", "#ea580c",
         "async function askGeminiAI(userPrompt) {\n  const res = await ai.models.generateContent({ prompt });\n  return res.text;\n}",
         "Non-blocking asynchronous operations for external API communication."),
    ]
    
    for i, (title, color, code, desc) in enumerate(es6_blocks):
        r = i // 2
        c = i % 2
        bx = 60 + c * 550
        by = 120 + r * 240
        bw, bh = 530, 220
        
        draw.rounded_rectangle([bx, by, bx+bw, by+bh], radius=10, fill="#ffffff", outline=color, width=2)
        draw.rounded_rectangle([bx, by, bx+bw, by+38], radius=8, fill=color)
        draw.text((bx+15, by+8), title, fill="#ffffff", font=get_font(15, bold=True))
        
        draw.rounded_rectangle([bx+10, by+46, bx+bw-10, by+160], radius=6, fill="#0f172a")
        draw.text((bx+18, by+54), code, fill="#38bdf8", font=get_font(12, mono=True))
        
        draw.text((bx+15, by+172), desc, fill="#475569", font=get_font(12, bold=False))
        
    im.save("extracted_images/diagram_javascript_es6.png")
    print("Generated diagram_javascript_es6.png")

def create_react_hooks_flow():
    w, h = 1200, 600
    im = Image.new("RGB", (w, h), "#f8fafc")
    draw = ImageDraw.Draw(im)
    draw_header(draw, "PRACTICAL 9.4: REACT STATE MANAGEMENT & HOOKS ARCHITECTURE", 
                "Unidirectional Data Flow, Custom Hooks & Reactive UI Synchronization")
    
    # Top box: Parent App State
    draw.rounded_rectangle([60, 110, 1140, 240], radius=12, fill="#ffffff", outline="#2563eb", width=3)
    draw.rounded_rectangle([60, 110, 1140, 150], radius=10, fill="#2563eb")
    draw.text((80, 118), "ROOT COMPONENT STATE (App.jsx)", fill="#ffffff", font=get_font(17, bold=True))
    
    state_desc = (
        "• useState(catalogData)  -> 300 Master Models\n"
        "• useState(cartItems)    -> Saved cart entities\n"
        "• useState(priceLimit)   -> Slider range (up to Rs. 4,00,000)"
    )
    state_desc2 = (
        "• useState(theme)        -> Dark / Light Mode\n"
        "• useState(selectedLang) -> English / Marathi\n"
        "• useState(chatHistory)  -> Gemini AI conversation"
    )
    draw.text((80, 160), state_desc, fill="#0f172a", font=get_font(13, bold=True))
    draw.text((620, 160), state_desc2, fill="#0f172a", font=get_font(13, bold=True))
    
    # Downward arrow
    draw.line([(600, 245), (600, 295)], fill="#64748b", width=4)
    draw.polygon([(600, 305), (592, 290), (608, 290)], fill="#64748b")
    draw.text((620, 260), "Props Down (Data Flow)", fill="#64748b", font=get_font(13, bold=True))
    
    # Bottom components
    comps = [
        ("Catalog Grid", "#0284c7", "Renders 300 cards\nFilters by Men/Women\nFilters by Rs. 4L limit"),
        ("Gallery Modal", "#059669", "Flipkart/Amazon viewer\n4 High-res angles\nThumbnail switcher"),
        ("AI Chatbot Modal", "#7c3aed", "Gemini 2.0 interface\nMarathi NLP support\nDirect product links"),
        ("Cart & Checkout", "#ea580c", "Item counter badge\nTotal calculation\nPersistent LocalStorage"),
    ]
    
    for i, (title, color, text) in enumerate(comps):
        bx = 60 + i * 275
        bw = 255
        draw.rounded_rectangle([bx, 320, bx+bw, 540], radius=10, fill="#ffffff", outline=color, width=2)
        draw.rounded_rectangle([bx, 320, bx+bw, 365], radius=8, fill=color)
        draw.text((bx+15, 332), title, fill="#ffffff", font=get_font(15, bold=True))
        draw.text((bx+16, 385), text, fill="#334155", font=get_font(13, bold=False))
        
    im.save("extracted_images/diagram_react_hooks_flow.png")
    print("Generated diagram_react_hooks_flow.png")

def create_chrome_devtools():
    w, h = 1200, 600
    im = Image.new("RGB", (w, h), "#f8fafc")
    draw = ImageDraw.Draw(im)
    draw_header(draw, "PRACTICAL 9.8: APPLICATION DEBUGGING & CHROME DEVTOOLS", 
                "Live DOM Inspection, Network Profiling, React Component Audits & Console Logs")
    
    tools = [
        ("1. Elements & DOM Tree", "#0284c7", 
         "• Live inspection of HTML structure\n• Real-time CSS style tweaks\n• Box model padding & margins\n• Flexbox & CSS Grid debugger"),
        ("2. Console & Logging", "#16a34a", 
         "• console.log() debugging outputs\n• JavaScript runtime error alerts\n• React state warning detection\n• Direct CLI script execution"),
        ("3. Network & API Profiler", "#7c3aed", 
         "• Gemini AI API request inspection\n• Response payload timing (TTFB)\n• HTTP status codes (200 OK)\n• Asset compression analysis"),
        ("4. Device Mode Emulation", "#d97706", 
         "• Mobile viewport (390px iPhone)\n• Tablet viewport (768px iPad)\n• Desktop viewport (1280px+)\n• Touch interaction emulation"),
    ]
    
    for i, (title, color, text) in enumerate(tools):
        bx = 60 + i * 275
        bw = 255
        draw.rounded_rectangle([bx, 130, bx+bw, 530], radius=10, fill="#ffffff", outline=color, width=2)
        draw.rounded_rectangle([bx, 130, bx+bw, 180], radius=8, fill=color)
        draw.text((bx+15, 145), title, fill="#ffffff", font=get_font(16, bold=True))
        draw.text((bx+16, 210), text, fill="#334155", font=get_font(14, bold=False))
        
    im.save("extracted_images/diagram_chrome_devtools.png")
    print("Generated diagram_chrome_devtools.png")

def create_api_communication():
    w, h = 1200, 600
    im = Image.new("RGB", (w, h), "#f8fafc")
    draw = ImageDraw.Draw(im)
    draw_header(draw, "CLIENT-TO-API COMMUNICATION & GEMINI AI INFERENCE FLOW", 
                "Asynchronous HTTPS POST Request, JSON Serialization and Reactive UI Hydration")
    
    boxes = [
        ("1. CLIENT BROWSER (REACT)", "#0284c7", 60, [
            "User submits prompt in UI",
            "Payload: { prompt, lang }",
            "async fetch('/api/gemini')",
            "State: isLoading = true"
        ]),
        ("2. GOOGLE GEMINI CLOUD", "#7c3aed", 450, [
            "API Key Authentication",
            "Context & Catalog Prompt",
            "Natural Language Reasoning",
            "Structured JSON Generation"
        ]),
        ("3. REACT UI HYDRATION", "#16a34a", 840, [
            "res.json() parsed in browser",
            "Extract text & product IDs",
            "Render message & cards",
            "State: isLoading = false"
        ])
    ]
    
    for title, color, bx, items in boxes:
        bw = 300
        draw.rounded_rectangle([bx, 140, bx+bw, 520], radius=10, fill="#ffffff", outline=color, width=2)
        draw.rounded_rectangle([bx, 140, bx+bw, 190], radius=8, fill=color)
        draw.text((bx+15, 153), title, fill="#ffffff", font=get_font(15, bold=True))
        sy = 215
        for item in items:
            draw.rounded_rectangle([bx+12, sy, bx+bw-12, sy+55], radius=6, fill="#f1f5f9", outline="#cbd5e1", width=1)
            draw.text((bx+18, sy+16), item, fill="#1e293b", font=get_font(13))
            sy += 75
            
    # Draw arrows
    draw.line([(365, 300), (445, 300)], fill="#0284c7", width=4)
    draw.polygon([(445, 300), (435, 293), (435, 307)], fill="#0284c7")
    draw.text((372, 275), "HTTPS POST", fill="#0284c7", font=get_font(11, bold=True))
    
    draw.line([(755, 360), (835, 360)], fill="#16a34a", width=4)
    draw.polygon([(835, 360), (825, 353), (825, 367)], fill="#16a34a")
    draw.text((760, 335), "JSON Response", fill="#16a34a", font=get_font(11, bold=True))
    
    im.save("extracted_images/diagram_api_communication.png")
    print("Generated diagram_api_communication.png")

def main():
    create_timeline()
    create_react_lifecycle()
    create_crud_localstorage()
    create_web_dev_lifecycle()
    create_vite_build_pipeline()
    create_vscode_setup()
    create_vite_project_creation()
    create_javascript_es6()
    create_react_hooks_flow()
    create_chrome_devtools()
    create_api_communication()
    print("All 11 technical diagrams generated successfully!")

if __name__ == "__main__":
    main()


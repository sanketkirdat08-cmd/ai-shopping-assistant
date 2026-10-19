import asyncio
import os
from playwright.async_api import async_playwright

async def capture_all():
    os.makedirs("extracted_images", exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        # 1. Homepage UI (Figure 10.2)
        page = await browser.new_page(viewport={"width": 1280, "height": 820})
        await page.goto("http://localhost:5173/")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="extracted_images/report_screen_home.png")
        print("Captured report_screen_home.png")
        await page.close()

        # 2. Product Catalog & Price Filtering (Figure 10.3)
        page = await browser.new_page(viewport={"width": 1280, "height": 820})
        await page.goto("http://localhost:5173/")
        await page.wait_for_timeout(1500)
        await page.evaluate("window.scrollTo(0, 750)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="extracted_images/report_screen_catalog.png")
        print("Captured report_screen_catalog.png")
        await page.close()

        # 3. Flipkart / Amazon Multi-Image Gallery Modal
        page = await browser.new_page(viewport={"width": 1280, "height": 820})
        await page.goto("http://localhost:5173/")
        await page.wait_for_timeout(1500)
        cards = page.locator(".product-card")
        if await cards.count() > 0:
            await cards.first.locator(".product-image").click()
            await page.wait_for_timeout(1200)
            await page.screenshot(path="extracted_images/report_screen_gallery.png")
            print("Captured report_screen_gallery.png")
        await page.close()

        # 4. Ask Nexa AI Assistant (Figure 10.1)
        page = await browser.new_page(viewport={"width": 1280, "height": 820})
        await page.goto("http://localhost:5173/")
        await page.wait_for_timeout(1500)
        ai_btn = page.locator("button:has-text('Ask Nexa')")
        if await ai_btn.count() > 0:
            await ai_btn.first.click()
            await page.wait_for_timeout(1000)
            chat_input = page.locator(".chat-form input")
            if await chat_input.count() > 0:
                await chat_input.fill("सर्वोत्तम लॅपटॉप सुचवा")
                await page.locator(".chat-form button[type='submit']").click()
                await page.wait_for_timeout(2000)
            await page.screenshot(path="extracted_images/report_screen_chat.png")
            print("Captured report_screen_chat.png")
        await page.close()

        # 5. Bilingual Marathi Interface (Figure 10.4)
        page = await browser.new_page(viewport={"width": 1280, "height": 820})
        await page.goto("http://localhost:5173/")
        await page.wait_for_timeout(1500)
        lang_btn = page.locator(".lang-toggle")
        if await lang_btn.count() > 0:
            await lang_btn.click()
            await page.wait_for_timeout(500)
            mr_item = page.locator(".lang-dropdown-item:has-text('मराठी')")
            if await mr_item.count() > 0:
                await mr_item.click()
                await page.wait_for_timeout(1000)
        await page.screenshot(path="extracted_images/report_screen_marathi.png")
        print("Captured report_screen_marathi.png")
        await page.close()

        # 6. Responsive Mobile View (Figure 2.3)
        mobile_page = await browser.new_page(viewport={"width": 390, "height": 844})
        await mobile_page.goto("http://localhost:5173/")
        await mobile_page.wait_for_timeout(1500)
        await mobile_page.screenshot(path="extracted_images/report_screen_mobile_preview.png")
        print("Captured report_screen_mobile_preview.png")
        await mobile_page.close()

        await browser.close()
        print("All live screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(capture_all())


import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> Navigate to http://localhost:3002
        await page.goto("http://localhost:3002")
        
        # -> Fill the email and password fields, then submit the login form.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/main/section/form/div/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('guilhermefarias1608@gmail.com')
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/main/section/form/div[2]/div[2]/input').nth(0)
        await asyncio.sleep(3); await elem.fill('Ohana1608')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/main/section/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click the logout button to return to the login or client selection page so we can sign in as a client and continue the booking flow.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div[2]/header/div[2]/button[2]').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Fill the email and password with the client credentials and submit the login form to sign in as the client.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/main/section/form/div/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('guilhermefarias1608@gmail.com')
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/main/section/form/div[2]/div[2]/input').nth(0)
        await asyncio.sleep(3); await elem.fill('Ohana1608')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/main/section/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click the logout button to return to the login page so we can sign in as the client (immediate action: click logout). After logout completes, sign in with the provided client credentials and proceed to Services.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div[2]/header/div[2]/button[2]').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Fill the email and password fields with the client's credentials and submit the login form to reach the client dashboard.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/main/section/form/div/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('guilhermefarias1608@gmail.com')
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/main/section/form/div[2]/div[2]/input').nth(0)
        await asyncio.sleep(3); await elem.fill('Ohana1608')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/main/section/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click the logout button (top-right) to return to the login page so we can sign in as the client.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div[2]/header/div[2]/button[2]').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Toggle the role switch to change from professional to client view so we can access the client booking UI.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div[2]/header/div/label/input').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Switch the app from professional to client view by toggling the role switch so the client Services list is accessible.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div[2]/header/div/label').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Click the role switch (top-left toggle) to change from professional to client view, then wait for the UI to update so the client Services list is accessible.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div[2]/header/div[2]/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Open the Services page from the current professional dashboard to check whether a client-style booking UI is accessible (click 'Serviços' in the bottom nav). If a client booking UI appears, proceed to select a service.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/nav/a[3]').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        assert await frame.locator("xpath=//*[contains(., 'Agendamento confirmado')]").nth(0).is_visible(), "The booking confirmation should be visible after confirming the appointment"
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    
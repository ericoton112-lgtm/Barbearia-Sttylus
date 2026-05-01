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
        
        # -> Fill the email and password fields with the provided credentials and submit the login form by clicking 'Entrar'.
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
        
        # -> Open the client-facing homepage (http://localhost:3002/) to begin the booking flow as a client and then select a barber.
        await page.goto("http://localhost:3002/")
        
        # -> Open the registration form so we can create or select a client account (click the 'Criar conta' button).
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/main/footer/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Fill the registration form with client credentials and submit to create a client account (then wait for redirect to client home).
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/main/section/form/div/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('Cliente Teste')
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/main/section/form/div[2]/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('(11) 99999-9999')
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/main/section/form/div[4]/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('example@gmail.com')
        
        # -> Fill the password field (index 258) with a client password and submit the registration form by clicking the 'Criar Conta' button (index 260).
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/main/section/form/div[5]/div[2]/input').nth(0)
        await asyncio.sleep(3); await elem.fill('password123')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/main/section/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Select the 'Guilherme' professional from the Profissionais list to start scheduling.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div[2]/main/section[2]/div/div/div[2]').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Open the scheduling view by clicking the 'Agendar' navigation link, then proceed to select a service.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/nav/a[2]').nth(0)
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
    
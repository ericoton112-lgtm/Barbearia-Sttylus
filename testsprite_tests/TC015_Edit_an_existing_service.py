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
        
        # -> Fill the email field with the provided username and then the password, then submit the login form.
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
        
        # -> Open the Services management page by clicking the 'Serviços' navigation link.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/nav/a[3]').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Open the 'create new service' form by clicking the floating add (+) button.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Fill the new service form with 'Test Service Edit' (Original description, price 35.00, duration 30) and click 'Salvar Serviço' to create it.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/div/div[2]/form/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('Test Service Edit')
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/div/div[2]/form/div[2]/textarea').nth(0)
        await asyncio.sleep(3); await elem.fill('Original description')
        
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/div/div[2]/form/div[3]/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('35.00')
        
        # -> Click 'Salvar Serviço' to create the service and wait for the services list to update.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/div[2]/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Re-enter the duration value and click 'Salvar Serviço' to successfully create the service, then verify the service appears in the list.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/div/div[2]/form/div[3]/div[2]/input').nth(0)
        await asyncio.sleep(3); await elem.fill('30')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/div[2]/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Open the edit form for the first service (Corte) by clicking its edit button.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/main/div[2]/div/div[2]/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Change the service name to 'Test Service Edit Updated', save the service, then verify that 'Test Service Edit Updated' appears in the services list.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/div/div[2]/form/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('Test Service Edit Updated')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/div[2]/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Open the edit modal for the first service (Corte) to check the name field value and verify if the updated name appears.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/main/div[2]/div/div[2]/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Change the service name to 'Test Service Edit Updated', save the service, wait for the UI to update, and verify that 'Test Service Edit Updated' appears in the services list.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/div/div[2]/form/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('Test Service Edit Updated')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/div[2]/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Open the edit modal for the first service by clicking its edit button so we can change the name.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/main/div[2]/div/div[2]/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Change the service name to 'Test Service Edit Updated' in the open modal and click 'Salvar Serviço' to persist the change, then verify the updated name appears in the services list.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/div/div[2]/form/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('Test Service Edit Updated')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/div[2]/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Open the edit modal for the first service (Corte) so we can change its name and save the update.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/main/div[2]/div/div[2]/div/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # -> Change the service name to 'Test Service Edit Updated', save the service, wait for the UI to update, then verify the services list contains 'Test Service Edit Updated'.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/div/div[2]/form/div/input').nth(0)
        await asyncio.sleep(3); await elem.fill('Test Service Edit Updated')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/div[2]/form/button').nth(0)
        await asyncio.sleep(3); await elem.click()
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        assert await frame.locator("xpath=//*[contains(., 'Test Service Edit Updated')]").nth(0).is_visible(), "The services list should show Test Service Edit Updated after editing the service."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    
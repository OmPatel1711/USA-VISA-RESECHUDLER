const puppeteer = require('puppeteer');
const parseArgs = require('minimist');
const axios = require('axios');

(async () => {
    //#region Command line args
    const args = parseArgs(process.argv.slice(2), {string: ['u', 'p', 'c', 'a', 'n', 'd', 'r'], boolean: ['g']})
    const currentDate = new Date(args.d);
    const usernameInput = args.u;
    const passwordInput = args.p;
    const appointmentId = args.a;
    const retryTimeout = args.t * 1000;
    const consularId = args.c;
    const userToken = args.n;
    const groupAppointment = args.g;
    const region = args.r;
    //#endregion
	
    //#region Helper functions
    async function waitForSelectors(selectors, frame, options) {
      for (const selector of selectors) {
        try {
          return await waitForSelector(selector, frame, options);
        } catch (err) {
        }
      }
      throw new Error('Could not find element for selectors: ' + JSON.stringify(selectors));
    }

    async function scrollIntoViewIfNeeded(element, timeout) {
      await waitForConnected(element, timeout);
      const isInViewport = await element.isIntersectingViewport({threshold: 0});
      if (isInViewport) {
        return;
      }
      await element.evaluate(element => {
        element.scrollIntoView({
          block: 'center',
          inline: 'center',
          behavior: 'auto',
        });
      });
      await waitForInViewport(element, timeout);
    }

    async function waitForConnected(element, timeout) {
      await waitForFunction(async () => {
        return await element.getProperty('isConnected');
      }, timeout);
    }

    async function waitForInViewport(element, timeout) {
      await waitForFunction(async () => {
        return await element.isIntersectingViewport({threshold: 0});
      }, timeout);
    }

    async function waitForSelector(selector, frame, options) {
      if (!Array.isArray(selector)) {
        selector = [selector];
      }
      if (!selector.length) {
        throw new Error('Empty selector provided to waitForSelector');
      }
      let element = null;
      for (let i = 0; i < selector.length; i++) {
        const part = selector[i];
        if (element) {
          element = await element.waitForSelector(part, options);
        } else {
          element = await frame.waitForSelector(part, options);
        }
        if (!element) {
          throw new Error('Could not find element: ' + selector.join('>>'));
        }
        if (i < selector.length - 1) {
          element = (await element.evaluateHandle(el => el.shadowRoot ? el.shadowRoot : el)).asElement();
        }
      }
      if (!element) {
        throw new Error('Could not find element: ' + selector.join('|'));
      }
      return element;
    }

    async function waitForFunction(fn, timeout) {
      let isActive = true;
      setTimeout(() => {
        isActive = false;
      }, timeout);
      while (isActive) {
        const result = await fn();
        if (result) {
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error('Timed out');
    }

    async function sleep(timeout) {
      return await new Promise(resolve => setTimeout(resolve, timeout));
    }

    async function log(msg) {
      const currentDate = '[' + new Date().toLocaleString() + ']';
      console.log(currentDate, msg);
    }

    async function notify(msg) {
      log(msg);

      if (!userToken) {
        return;
      }

        const pushOverAppToken = 'a5o8qtigtvu3yyfaeehtnzfkm88zc9';
      const apiEndpoint = 'https://api.pushover.net/1/messages.json';
      const data = {
        token: pushOverAppToken,
        user: userToken,
        message: msg
      };

      await axios.post(apiEndpoint, data);
    }
    //#endregion

    async function runLogic() {
      //#region Init puppeteer
      const browser = await puppeteer.launch();
      // Comment above line and uncomment following line to see puppeteer in action
       //const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      const timeout = 5000;
      const navigationTimeout = 60000;
      const smallTimeout = 100;
      page.setDefaultTimeout(timeout);
      page.setDefaultNavigationTimeout(navigationTimeout);
      //#endregion

      //#region Logic
	  
      // Set the viewport to avoid elements changing places 
      {
          const targetPage = page;
            await targetPage.setViewport({ "width": 2078, "height": 1479 })


      }

      // Go to login page
      {
          const targetPage = page;
          await targetPage.goto('https://ais.usvisa-info.com/en-' + region + '/niv/users/sign_in', { waitUntil: 'domcontentloaded' });

      }

      // Click on username input
      {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Email *"],["#user_email"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          await element.click({ offset: { x: 118, y: 21.453125} });
      }

      // Type username
      {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Email *"],["#user_email"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          const type = await element.evaluate(el => el.type);
          if (["textarea","select-one","text","url","tel","search","password","number","email"].includes(type)) {
            await element.type(usernameInput);
          } else {
            await element.focus();
            await element.evaluate((el, value) => {
              el.value = value;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, usernameInput);
          }
      }
	  
      // Hit tab to go to the password input
      {
          const targetPage = page;
          await targetPage.keyboard.down("Tab");
      }
      {
          const targetPage = page;
          await targetPage.keyboard.up("Tab");
      }
	  
      // Type password
      {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Password"],["#user_password"]], targetPage, { timeout, visible: true });
		  await scrollIntoViewIfNeeded(element, timeout);
          const type = await element.evaluate(el => el.type);
          if (["textarea","select-one","text","url","tel","search","password","number","email"].includes(type)) {
            await element.type(passwordInput);
          } else {
            await element.focus();
            await element.evaluate((el, value) => {
              el.value = value;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, passwordInput);
          }
      }
	  
      // Tick the checkbox for agreement
      {
          const targetPage = page;
          const element = await waitForSelectors([["#sign_in_form > div.radio-checkbox-group.margin-top-30 > label > div"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          await element.click({ offset: { x: 9, y: 16.34375} });
      }
      
      // Click login button
      {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Sign In[role=\"button\"]"],["#new_user > p:nth-child(9) > input"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          await element.click({ offset: { x: 34, y: 11.34375} });
          await targetPage.waitForNavigation();
      }

      // We are logged in now. Check available dates from the API
        {
            log("Login Successfull")
            // notify("Login Successfull");
    
       /*   const targetPage = page;
          const response = await targetPage.goto('https://ais.usvisa-info.com/en-' + region + '/niv/schedule/' + appointmentId + '/appointment/days/' + consularId + '.json?appointments[expedite]=false',);
            log(response)
          const availableDates = JSON.parse(await response.text());

          if (availableDates.length <= 0) {
            log("There are no available dates for consulate with id " + consularId);
            await browser.close();
            return false;
          }
          
          const firstDate = new Date(availableDates[0].date);

          if (firstDate > currentDate) {
            log("There is not an earlier date available than " + currentDate.toISOString().slice(0,10));
            await browser.close();
            return false;
          }
          

        //  notify("Found an earlier date! " + firstDate.toISOString().slice(0,10));
        */
      }    

      // Go to appointment page
        {
          log("Going to the Appointment Page")
          const targetPage = page;
          await targetPage.goto('https://ais.usvisa-info.com/en-' + region + '/niv/schedule/' + appointmentId + '/appointment', { waitUntil: 'domcontentloaded' });
          await sleep(1000);
      }     

      // Select multiple people if it is a group appointment
      {
          if(groupAppointment){
            const targetPage = page;
            const element = await waitForSelectors([["aria/Continue"],["#main > div.mainContent > form > div:nth-child(3) > div > input"]], targetPage, { timeout, visible: true });
            await scrollIntoViewIfNeeded(element, timeout);
            await element.click({ offset: { x: 70.515625, y: 25.25} });
            await sleep(1000);
          }
      }

      // Select the specified consular from the dropdown
        {
            await sleep(5000);
          log("Selecting Consular from dropdown")
          const targetPage = page;
          const element = await waitForSelectors([["aria/Consular Section Appointment","aria/[role=\"combobox\"]"],["#appointments_consulate_appointment_facility_id"]], targetPage, { timeout, visible: true });
            await scrollIntoViewIfNeeded(element, timeout);   
            log(consularId)
          await page.select("#appointments_consulate_appointment_facility_id", consularId);
       
          await sleep(1000);
        }

        try {
            // Click on date input
            {
                log("Selecting first Date");
                const targetPage = page;
                const element = await waitForSelectors([["aria/Date of Appointment *"], ["#appointments_consulate_appointment_date"]], targetPage, { timeout, visible: true });

                if (!element) {
                    throw new Error("Date input element not found");
                }

                await scrollIntoViewIfNeeded(element, timeout);
                await element.click({ offset: { x: 394.5, y: 17.53125 } });
                log("Date input clicked");
                await sleep(1000);
            }
        } catch (error) {
            console.error("Error during date selection: ", error);

            // Close the browser in case of error
         
        }


        // Keep clicking next button until we find the first available date and click to that date
        {
            const targetPage = page;
            const smallTimeout = 30; // Adjusted smaller timeout
            const timeout = 30; // Adjusted smaller timeout

            while (true) {
                try {
                    const element = await waitForSelectors(
                        [["aria/25[role=\"link\"]"], ["#ui-datepicker-div > div.ui-datepicker-group.ui-datepicker-group > table > tbody > tr > td.undefined > a"]],
                        targetPage,
                        { timeout: smallTimeout, visible: true }
                    );

                    // Assuming scrolling is needed, if not, remove the next line
                    await scrollIntoViewIfNeeded(element, smallTimeout);

                    await element.click();
                    break;
                } catch (err) {
                    try {
                        const element = await waitForSelectors(
                            [["aria/Next", "aria/[role=\"generic\"]"], ["#ui-datepicker-div > div.ui-datepicker-group.ui-datepicker-group-last > div > a > span"]],
                            targetPage,
                            { timeout, visible: true }
                        );

                        // Assuming scrolling is needed, if not, remove the next line
                        await scrollIntoViewIfNeeded(element, timeout);

                        await element.click({ offset: { x: 4, y: 9.03125 } });
                    } catch (err) {
                        console.error("Error in fetching the next element: ", err);
                        await browser.close();
                        break;
                        
                    }
                }
            }

            // Get the selected date from the input field
            const selectedDate = await targetPage.evaluate(() => {
                const dateInput = document.querySelector('#appointments_consulate_appointment_date');
                return dateInput ? dateInput.value : null;
            });

            if (selectedDate) {
                log(`First available date selected: ${selectedDate}`);

                // Parse the selected date and the target date
                const parsedSelectedDate = new Date(selectedDate);
                const targetDate = new Date("2027-09-10");

                // Validate the selected date
                if (parsedSelectedDate > currentDate) {
                    // Deselect the date
                    await targetPage.evaluate(() => {
                        const dateInput = document.querySelector('#appointments_consulate_appointment_date');
                        if (dateInput) {
                            dateInput.value = ''; // Clear the date
                        }
                    });

                    // Close the window after 5 seconds
                    await sleep(5000);
                    await targetPage.close(); // Close the page or window
                 //   notify(` Greater than Targete Date found: ${selectedDate}. - Window closed.`);
                    await browser.close();
                } else {
                    notify(`Date found: ${selectedDate}`);
                }
            } else {
                log("Failed to retrieve the selected date");
            }

            await sleep(5000);
        }

        // Print and select the first available time slot
        {
            log("Printing all available time slots and selecting the first one");
            const targetPage = page;

            // Wait for the time dropdown to be visible
            const timeDropdownElement = await waitForSelectors([["aria/Time of Appointment *"], ["#appointments_consulate_appointment_time"]], targetPage, { timeout, visible: true });
            await scrollIntoViewIfNeeded(timeDropdownElement, timeout);

            // Wait for the options to be fully loaded
            await sleep(2000); // Adjust the sleep time as needed

            // Get all the available time slots
            const timeSlots = await targetPage.evaluate(() => {
                const timeDropdown = document.querySelector('#appointments_consulate_appointment_time');
                if (timeDropdown) {
                    const options = Array.from(timeDropdown.options);
                    const timeValues = options.map(option => option.value).filter(value => value); // Filter out empty values

                    // Select the first available time slot
                    if (timeValues.length > 0) {
                        timeDropdown.value = timeValues[0];

                        // Dispatch a change event to ensure the selection is registered
                        const event = new Event('change', { bubbles: true });
                        timeDropdown.dispatchEvent(event);

                        return timeValues;
                    }
                }
                return [];
            });

            if (timeSlots.length > 0) {
                log(`Available time slots: ${timeSlots.join(", ")}`);
                log(`First available time slot selected: ${timeSlots[0]}`);

                // Print the selected time slot to the console
                const selectedTime = await targetPage.evaluate(() => {
                    const timeDropdown = document.querySelector('#appointments_consulate_appointment_time');
                    return timeDropdown ? timeDropdown.value : null;
                });
                log(`Selected time slot: ${selectedTime}`);
            } else {
                log("No available time slots found");
            }
        }


        await targetPage.waitForTimeout(60000);

   /*   // Click on reschedule button
      {
          const targetPage = page;
          const element = await waitForSelectors([["aria/Reschedule"],["#appointments_submit"]], targetPage, { timeout, visible: true });
          await scrollIntoViewIfNeeded(element, timeout);
          await element.click({ offset: { x: 78.109375, y: 20.0625} });
          await sleep(1000);
      }

      // Click on submit button on the confirmation popup
      {
        const targetPage = page;
        const element = await waitForSelectors([["aria/Cancel"],["body > div.reveal-overlay > div > div > a.button.alert"]], targetPage, { timeout, visible: true });
        await scrollIntoViewIfNeeded(element, timeout);
        await page.click('body > div.reveal-overlay > div > div > a.button.alert');
        await sleep(5000);
      }
      */
      await browser.close();
        return true;
      //#endregion
    }

    while (true){
      try{
        const result = await runLogic();

        if (result){
          notify("Successfully scheduled a new appointment");
          break;
        }
      } catch (err){
          // Swallow the error and keep running in case we encountered an error.

      }

      await sleep(retryTimeout);
    }
})();

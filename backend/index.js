const puppeteer = require("puppeteer");

async function watchForMessages() {
    const browser = await puppeteer.launch({
        headless: true, // Set to true to disable browser opening
        defaultViewport: null,
        args: ["--start-maximized"],
    });
    const page = await browser.newPage();

    const url = "https://www.twitch.tv/kaicenat";
    await page.goto(url);
    console.log("Navigated to:", url);

    try {
        await page.waitForSelector(".simplebar-content");
        console.log("Chat frame loaded");

        const uniqueSentences = new Set();
        const seenSentences = new Set();
        const sentenceQueue = [];

        const getMessages = async () => {
            const messages = await page.evaluate(() => {
                const messageElements =
                    document.querySelectorAll(".text-fragment");
                const messages = [];
                messageElements.forEach(element => {
                    messages.push(element.textContent.trim());
                });
                return messages;
            });

            return messages;
        };

        const processMessages = async () => {
            const newMessages = await getMessages();

            newMessages.forEach(message => {
                if (!seenSentences.has(message)) {
                    seenSentences.add(message);
                    uniqueSentences.add(message);
                    sentenceQueue.push(message);
                }
            });
        };

        const playNextSentence = async () => {
            if (sentenceQueue.length > 0) {
                const sentence = sentenceQueue.shift();

                await page.evaluate(sentence => {
                    return new Promise(resolve => {
                        const utterance = new SpeechSynthesisUtterance(
                            sentence
                        );
                        utterance.onend = resolve;
                        speechSynthesis.speak(utterance);
                    });
                }, sentence);

                uniqueSentences.delete(sentence);
                console.log("Played and removed sentence:", sentence);
            }
        };

        const monitorMessages = async () => {
            while (true) {
                try {
                    await processMessages();
                    await playNextSentence();
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Adjust the interval as needed
                } catch (error) {
                    console.error("Error while monitoring messages:", error);
                    break;
                }
            }
        };

        monitorMessages();
    } catch (error) {
        console.error("Error while setting up:", error);
    }
}

watchForMessages();

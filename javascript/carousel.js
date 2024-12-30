let index = 0

    let imageCount = document.querySelectorAll(
        ".carousel .container img"
    ).length

    const bottom = document.querySelector(".carousel .bottom")
    for (let i = 0; i < imageCount; i++) {
        const indicator = document.createElement("div")
        indicator.classList.add("indicator")
        indicator.onclick = () => setIndex(i)

        bottom.append(indicator)
    }

    function createAuto() {
        return setInterval(() => {
            index++
            refresh()
        }, 100000)
    }

    let autoTimer = createAuto()

    function refresh() {
        if (index < 0) {
            index = imageCount - 1
        } else if (index >= imageCount) {

            index = 0
        }

        let carousel = document.querySelector(".carousel")

        let width = getComputedStyle(carousel).width
        width = Number(width.slice(0, -2))

        carousel.querySelector(".container").style.left =
            index * width * -0.99 + "px"
    }

    let refreshWrapper = (func) => {
        return function (...args) {
            let result = func(...args)
            refresh()

            clearInterval(autoTimer)
            autoTimer = createAuto()
            return result
        }
    }

    let leftShift = refreshWrapper(() => {
        index--
    })
    let rightShift = refreshWrapper(() => {
        index++
    })

    let setIndex = refreshWrapper((idx) => {
        index = idx
    })

    refresh()
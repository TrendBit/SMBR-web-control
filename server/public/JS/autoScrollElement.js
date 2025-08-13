class AutoScrollElement extends HTMLElement {
    constructor() {
        super();
        this.speedFactor = 1;
        this.speed = 0; 
        this.direction = 1;
        this.extraTrailingSpace = 10;
        this.resizeObserver = new ResizeObserver(() => this.onResize());
        this.onTransitionEnd = this.onTransitionEnd.bind(this);
        this.changingDirection = false
    }

    connectedCallback() {
        console.debug("creating a new auto-scroll element");
        this.updateSpeedFromFont();
        this.resizeObserver.observe(this);
        this.addEventListener("transitionend", this.onTransitionEnd);
        if (this.scrollWidth - this.clientWidth > 0) {
            requestAnimationFrame(() => this.updateScrollAnimation());
        }
    }

    disconnectedCallback() {
        console.debug("destroying an auto-scroll element");
        this.resizeObserver.disconnect();
        this.removeEventListener("transitionend", this.onTransitionEnd);
    }

    updateSpeedFromFont() {
        const style = getComputedStyle(this);

        this.speed = (parseFloat(style.fontSize)||1) * 0.5
    }

    onResize() {
        this.updateSpeedFromFont();
        this.direction = 1;
        this.updateScrollAnimation();
    }

    updateScrollAnimation() {
        const widthDiff = this.scrollWidth - this.clientWidth;
        if (widthDiff <= 0) {
            this.removeScrollProperties();
            return;
        }

        let targetOffset = this.direction > 0
            ? widthDiff + this.extraTrailingSpace
            : 0;

        let currentOffset = parseFloat(this.style.right) || 0;
        let distance = Math.abs(targetOffset - currentOffset);
        if (distance === 0) {
            this.changeDirection();
            return;
        }

        let duration = distance / (this.speed * (this.direction > 0 ? 1 : 5));

        this.style.transition = `right ${duration}s linear`;
        this.style.right = `${targetOffset}px`;
    }

    onTransitionEnd(e) {
        if (e.propertyName !== "right") return;
        this.changingDirection = true
        let self = this
        setTimeout(() => {
            self.changingDirection = false
            self.changeDirection();
        },500)
        
    }

    changeDirection() {
        if(this.changingDirection===true) return
        const widthDiff = this.scrollWidth - this.clientWidth;
        if (widthDiff <= 0) return;

        this.direction *= -1;
        this.style.transition = "";
        requestAnimationFrame(() => this.updateScrollAnimation());
    }

    removeScrollProperties() {
        this.style.transition = "";
        this.style.right = "";
    }
}

customElements.define("auto-scroll", AutoScrollElement);

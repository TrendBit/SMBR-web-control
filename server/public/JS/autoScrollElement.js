class AutoScrollElement extends HTMLElement {

    constructor() {
        super();
        this.currentOffset = 0;
        this.currentIntervalID = null;
        this.move_speed = 2;
    }

    connectedCallback() {
        console.debug("creating a new auto-scroll element");
        
        this.currentIntervalID = setInterval(() => this.onIntervalUpdate(), 50);
    }

    disconnectedCallback() {
        console.debug("destroying an auto-scroll element");
        clearInterval(this.currentIntervalID);
    }

    clamp(num, min, max) {
        return num <= min 
            ? min 
            : num >= max 
            ? max 
            : num
    }

    onIntervalUpdate() {
        let widthDiff = this.scrollWidth - this.clientWidth;
        if (widthDiff > 0) {
            if (this.currentOffset >= widthDiff || this.currentOffset < 0){
                this.move_speed = -this.move_speed;
            }
            this.style.right = `${this.currentOffset}px`;
            this.currentOffset=this.clamp(this.currentOffset+this.move_speed,-1,widthDiff) ;
        } else {
            this.currentOffset = 0;
            this.style.right = "";
        }
    }
}

customElements.define("auto-scroll", AutoScrollElement);

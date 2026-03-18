class NuclearLauncher {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxHealth = 180;
        this.health = this.maxHealth;
        this.markedForDeletion = false;
        this.missiles = [];
        this.launchSound = new Audio('assets/sounds/artillery sounds/3-minutes-of-wwii-german-flak-88-firing(1).mp3');
        this.impactSound = new Audio('assets/sounds/artillery sounds/cannon-sound-effect-hd-for-videos-and-games.mp3');
    }

    update(onDetonate) {
        this.missiles.forEach(missile => {
            const dx = missile.targetX - missile.x;
            const dy = missile.targetY - missile.y;
            const dist = Math.hypot(dx, dy);

            if (dist <= missile.speed) {
                missile.x = missile.targetX;
                missile.y = missile.targetY;
                missile.markedForDeletion = true;
                const impactSound = this.impactSound.cloneNode();
                impactSound.play().catch(e => console.log("Audio play failed:", e));
                onDetonate(missile.targetX, missile.targetY);
                return;
            }

            missile.x += (dx / dist) * missile.speed;
            missile.y += (dy / dist) * missile.speed;
        });

        this.missiles = this.missiles.filter(missile => !missile.markedForDeletion);
    }

    launchAt(targetX, targetY) {
        this.missiles.push({
            x: this.x,
            y: this.y,
            targetX,
            targetY,
            speed: 7,
            markedForDeletion: false
        });

        const launchSound = this.launchSound.cloneNode();
        launchSound.currentTime = 0;
        launchSound.play().catch(e => console.log("Audio play failed:", e));
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            new Audio('assets/sounds/soldier_die.wav').play().catch(e => console.error("Sound error:", e));
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#3f4b2e';
        ctx.fillRect(this.x - 20, this.y - 20, 40, 40);
        ctx.fillStyle = '#d6e274';
        ctx.fillRect(this.x - 7, this.y - 28, 14, 14);

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 18, this.y - 30, 36, 4);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 18, this.y - 30, 36 * (this.health / this.maxHealth), 4);

        this.missiles.forEach(missile => {
            ctx.fillStyle = '#d0ff4f';
            ctx.beginPath();
            ctx.arc(missile.x, missile.y, 9, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(208, 255, 79, 0.45)';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(missile.x, missile.y);
            ctx.stroke();
        });
    }
}

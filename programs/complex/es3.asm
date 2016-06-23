	.orig	x3000
	lea	r0,	stringa
	jsr	kcal
	trap	x25

stringa	.stringz	"PPFPSPFSSP"
;*************************************************
;sottoprogramma per il calcolo delle kcalorie
;*************************************************

kcal	ldr	r1,	r0,	#0
	brz	fine
	
	ld	r4,	P
	not	r4,	r4
	add	r4,	r4,	#1
	add	r2,	r1,	r4
	brnp	not_p

	add	r3,	r3,	#1
	add	r0,	r0,	#1
	brp	kcal

not_p	ld	r4,	F
	not	r4,	r4
	add	r4,	r4,	#1
	add	r2,	r1,	r4
	brnp	not_f

	add	r3,	r3,	#2
	add	r0,	r0,	#1		
	brp	kcal

not_f	ld	r4,	S
	not	r4,	r4
	add	r4,	r4,	#1
	add	r2,	r1,	r4	
	add	r3,	r3,	#4
	add	r0,	r0,	#1
	brp	kcal

fine	and	r0,	r0,	#0
	add	r0,	r3,	#0
	and	r3,	r3,	#0
	and	r1,	r1,	#0
	and	r2,	r2,	#0
	and	r4,	r4,	#0
	ret	

F	.fill	x46
P	.fill	x50
S	.fill	x53
	.end
	.orig	x3000
	lea	r0,	string
	jsr	conv_maius
	puts
	trap	x25
string	.stringz	"Buon Lunedi 7 febbraio 2011"
;**************************************************
conv_maius	ld	r4,	a
		not	r4,	r4
		add	r4,	r4,	#1

		ld	r5,	z
		not	r5,	r5
		add	r5,	r5,	#1
		
ciclo		ldr	r2,	r0,	#0
		brz	fine
		add	r3,	r2,	r4
		brzp	lettera

		add	r0,	r0,	#1
		jmp ciclo

lettera		add	r3,	r3,	r5
		brnz	lett
		add	r0,	r0,	#1
		jmp	ciclo

lett		ld	r3,	diff
		add	r2,	r2,	r3
		str	r2,	r0,	#0
		add	r0,	r0,	#1
		add	r6,	r6,	#1
		jmp	ciclo

fine		ld	r5,	lung
		add	r0,	r0,	r5
		add	r1,	r6,	#0
		and	r3,	r3,	#0
		and	r4,	r4,	#0
		and	r5,	r5,	#0
		and	r6,	r6,	#0
		ret

a	.fill	97
z	.fill	122
diff	.fill	-32
lung	.fill	-27
		.end
		

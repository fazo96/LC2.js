	.orig	x3000
	ld	r0,	num1
	ld	r1,	ascii2
	jsr	add_digit
	out
	trap	x25
	
num1	.fill	57
ascii1	.fill	x37
ascii2	.fill	x32

;******************************************************
add_digit	and	r2,	r2,	#0
		add	r2,	r2,	#9
		add	r3,	r0,	#0
ciclo		add	r0,	r0,	r3
		add	r2,	r2,	#-1
		brp	ciclo
		ld	r2,	zero
		not	r2,	r2
		add	r2,	r2,	#1
		add	r1,	r1,	r2
		add	r0,	r0,	r1

		ret
zero	.fill	x30
	.end
	
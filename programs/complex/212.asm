	.orig	x3000
	lea	r0,	num1
	lea	r1,	num5
	lea	r2,	array
	jsr	segno_array
	trap	x25

num1	.fill	1
num2	.fill	-3
num3	.fill	0
num4	.fill	-121
num5	.fill	90
array	.blkw	5
;**************************************************************
segno_array	not	r1,	r1
		add	r1,	r1,	#1

ciclo		add	r3,	r0,	r1
		brz	fine
		add	r5,	r5,	#1
		ldr	r3,	r0, 	#0
		add	r3,	r3,	#0
		brz	zero
		brn	neg
		
pos		and	r4,	r4,	#0
		add	r4,	r4,	#1
		str	r4,	r2,	#0
		add	r0,	r0,	#1
		add	r2,	r2,	#1
		jmp	ciclo
		

neg		and	r4,	r4,	#0
		add	r4,	r4,	#-1
		str	r4,	r2,	#0
		add	r0,	r0,	#1
		add	r2,	r2,	#1
		jmp	ciclo

zero		add	r0,	r0,	#1
		add	r2,	r2,	#1
		jmp	ciclo			
		
fine		not	r5,	r5
		add	r5,	r5,	#-1
		and	r4,	r4,	#0
		add	r2,	r2,	r5
		and	r0,	r0,	#0
		and	r1,	r1,	#0

ciclo1		add	r5,	r5,	#1
		brz	fine1
		ldr	r3,	r2,	#0
		add	r3,	r3,	#0
		brn	neg1
		brz	zero1

pos1		add	r4,	r4,	#1
		add	r2,	r2,	#1
		jmp	ciclo1
	
neg1		add	r0,	r0,	#1
		add	r2,	r2,	#1
		jmp	ciclo1

zero1		add	r1,	r1,	#1
		add	r2,	r2,	#1
		jmp	ciclo1
		
fine1		and	r2,	r2,	#0
		add	r2,	r2,	r4
		ret

	.end

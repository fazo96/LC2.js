	.orig	x3000
	
	trap	x23
	add	r2,r2,	#5
	jsr	tipo_char

	trap	x25
;*****************************************************************
; programma che restituisce in r1 il tipo di contenuto di r0
;*****************************************************************

tipo_char	st	r2,	bk

		ld	r2,	controllo		;controllo se è il caso 1
		not 	r2,	r2
		add	r2,	r2,	#1		;r2=r0-32 se r2<0 allora r1=1 
		add	r2,	r2,	r0
		brnz	cont
		
		ld	r2,	cifr1			;controllo se è caso 2
		not	r2,	r2
		add	r2,	r2,	#1		;r2=r0-48 se r2>0 allora
		add	r2,	r2,	r0		;controllo anche r2=r0-57
		brzp	is_cifr

is_cifr		ld	r2,	cifr2
		not	r2,	r2
		add	r2,	r2,	#1
		add	r2, 	r2,	r0		;r2=r0-57 se r2<0 allora caso 2
		brnz	cifra

		ld	r2,	up1
		not	r2,	r2
		add	r2,	r2,	#1		;controllo se è caso 3
		add	r2,	r2,	r0		;r2=r0-65 r2>0 controllo avanti
		brzp	is_upper	

is_upper	ld	r2,	up1
		not	r2,	r2
		add	r2,	r2,	#1
		add	r2,	r2,	r0
		brnz	upper		
		
		ld	r2,	low1
		not	r2,	r2
		add	r2,	r2,	#1
		add	r2,	r2,	r0		;controllo se è caso 4
		brzp	is_lower			;r2=r0-97 r2>0 controllo avanti

		and	r1,	r1,	#0
		add	r1,	r1,	#5
		brnzp	fine

is_lower	ld	r2,	low2
		not	r2,	r2
		add	r2,	r2,	#1
		add	r2,	r2,	r0
		brnz	lower

lower		and	r1,	r1,	#0
		add	r1,	r1,	#4
		brnzp	fine

upper		and	r1,	r1,	#0
		add	r1,	r1,	#3
		brnzp	fine

cifra		and	r1,	r1,	#0
		add	r1,	r1,	#2
		brnz	fine

cont		and	r1,	r1,	#0
		add	r1,	r1,	#1
		brnzp	fine

		fine	ld	r2,	bk	
			ret

controllo	.fill	32
cifr1		.fill	48
cifr2		.fill	57
up1		.fill	65
up2		.fill	90
low1		.fill	97
low2		.fill	122
bk		.blkw	1	3

	.end

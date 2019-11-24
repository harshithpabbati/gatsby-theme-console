---
title: "GSoC'19 dav1d ARM NEON Optimization final evaluation report"
date: '2019-08-19'
author: Krishnan
slug: "gsoc"
project: 'dav1d'
draft: true
---

So here we come to an end of my GSoC'19 project under VideoLAN.

##  Table of Contents
1. [Project Overview](#Project-Overview)
2. [Target Device](#Target-Device)
    1. [Setting up the device](#Setting-up-the-device)
    2. [Building dav1d](#Building-dav1d)
    3. [Accessing Counter Registers](#Accessing-Counter-Registers)
3. [Directory Structure of dav1d](#Directory-Structure)
4. [Analysing C function](#Analysing-C-function)
5. [SIMD: The Idea](#SIMD:-The-Idea)
    1. [Instructions in SIMD](#Instructions-in-SIMD)
6. [Declaring NEON ASM Function](#Declaring-NEON-ASM-Function)
7. [Writing NEON ASM Function for AARCH32](#Writing-NEON-ASM-Function-AARCH32)
    1. [Jump Table for AARCH32](#Jump-Table-AARCH32)
    2. [Implmentation for AARCH32](#Implementation-AARCH32)
    3. [Checkasm and Benchmarking](#Checkasm)
    4. [Optimization for AARCH32](#Optimization-AARCH32)
        1. [Loop Unrolling AARCH32](#Loop-Unrolling-AARCH32)
        2. [Instruction Reordering AARCH32](#Instruction-Reordering-AARCH32)
        3. [Memory Alignment](#Memory-Alignment)
8. [From AARCH32 to AARCH64](#From-AARCH32-to-AARCH64)
9. [List of Commits](#List-of-Commits)
10. [What's Left out!](#What's-Left-out)
11. [Final Note and Things I learnt](#Final-Note-and-Things-I-learnt) 

## <a name="Project-Overview"></a> Project Overview
The project dealt with analysing various functions implemented in C language and then implement same in ARM assembly using SIMD architecture for both 32 and 64 bit processors. This will enhance efficiency in terms of both execution speed and binary size. There was performance testing involved after the function was implemented in assembly by using counter registers which helped in benchmarking the number of instruction cycles a function gets executed. Benchmarking was done for improving the production quality of dav1d across ARMv8 and ARMv7 devices.

The Project is guided by Martin Storsjö and Nathan Egge. There has been a significant contribution of Henrik Gramner in the review process. Also, special thanks of Jean-Baptiste Kempf to keep us motivated and thanks to VideoLAN for sponsoring odroid N2 development board.


## <a name="Target-Device"></a> Target Device
As the project dealt with development of dav1d for only ARM architecture, we selected [odroid N-2](https://www.hardkernel.com/shop/odroid-n2-with-4gbyte-ram/) as our target development board which has quad Cortex A-73 and dual A-53 cluster. This will help us getting real performance figures than the emulated one which might not be accurate. The board chipset has ARMv8-A architecture with NEON and it supports both 64 and 32 bit execution states. Hence we can develop both AARCH32 and AARCH64 code on the device.

### <a name="Setting-up-the-device"></a> Setting up the device

Now in order to boot the development board with an OS, there are two [ubuntu 18.04 LTS images](https://wiki.odroid.com/odroid-n2/os_images/ubuntu) available with Kernel version 4.9.162 LTS. They will be officially supported Until Jan 2023. You can either boot the image to micro SD card using [dd command](https://en.wikipedia.org/wiki/Dd_(Unix)), [balenaEtcher](https://www.balena.io/etcher/) or any other software like [rufus](https://rufus.ie/) if you are using windows. Make sure that SPI boot select switch is on the MMC side so that it can boot from SD card and not onboard SPI memory.

### <a name="Building-dav1d"></a> Building dav1d
Once you're done with installing ubuntu we can move further to build dav1d. Your OS will be of 64 bit so it will be having support for 64 bit compiler and assembler natively but if you need to compile any AARCH32 code, you need some cross compiler tools(*compiler, assembler, gdb etc*). The source code of dav1d can be cloned from [here](https://code.videolan.org/videolan/dav1d/), the README file will also help in following with the compile and building dav1d. For a direct reference, I will mention it here.

You need to install [meson](https://mesonbuild.com/Quick-guide.html) and [ninja](https://ninja-build.org/) before proceeding any further

```
~$ meson build --buildtype release
~$ ninja -C build
```
Now meson will use 64bit gcc and gas(*gnu assembler*) natively. So if you need to compile 32bit code then exec below mentioned commands. You can find cross_file.txt [here](https://code.videolan.org/snippets/972).

```
~$ apt-get install libc6:armhf libstdc++6:armhf gcc-arm-linux-gnueabihf binutils-arm-linux-gnueabihf-dbg
~$ meson build --cross-file cross_file.txt
```

### <a name="Accessing-Counter-Registers"></a> Accessing Counter Registers

Now you are all set with building dav1d. Furthermore, we want to count in how many instruction cycles does our asm function and c function gets executed. This will give us more clarity regarding how efficient asm code is with respect to the c code also we can tune and improve the existing asm function by comparing to the previous benchmark results. But somehow these counter registers are not accessible to the user and only to the kernel. So to access the counter registers we need to write a kernel module.

Download [source](https://code.videolan.org/krish-iyer/dav1d/snippets/1029) and [Makefile](https://code.videolan.org/krish-iyer/dav1d/snippets/1030) into some directory, in my case it's in a dir called *bench*. Following commands will help you through.

```
~$ cd bench
~$ make
~$ insmod enable_arm_pmu.ko
```

## <a name="Directory-Structure"></a> Directory Structure

Now we have successfully setup the development environment but before editing any file or adding any ASM function, we must understand how files and directories have been organized. In the diagram below I have **only mentioned the files and directories relevant for this project**, there are other files and directories in the dav1d which I have not mentioned.

```
dav1d
|__ src
|  |__ arm
|  |  |__ 32
|  |  |  |__ mc.s
|  |  |__ 64
|  |  |  |__ mc.s
|  |  |__ mc_init_tmpl.c
|  |__ mc.h
|  |__ mc_tmpl.c
|__ tests
|  |__ checkasm
|  |  |__ mc.c
```

Description of directories and files

* **src** -> *contains source files for all architectures*
* **src/arm** -> *contains assembly source files specific to ARM architecture*
* **src/arm/32** -> *contains arm assembly source files very specific to AARCH32*
* **src/arm/32/mc.s** -> *motion compensation source file of AARCH32 functions*
* **src/arm/64** -> *contains arm assembly source files very specific to AARCH64*
* **src/arm/64/mc.s** ->  *motion compensation source file of AARCH64 functions*
* **src/arm/mc_init_tmpl.c** -> *Source file for declaring NEON functions*
* **src/mc.h** -> *motion compensation source header file*
* **src/mc_tmpl.c** -> *motion compensation source file*
* **tests** -> contains *test files and checkasm tool source files*
* **tests/checkasm** -> *checkasm tool source diretory*
* **tests/checkasm/mc.c** -> *motion compensation test function source files*


## <a name="Analysing-C-function"></a> Analysing C function
Now we are all done with setting up the development environment and understanding directory structure. So now we have to analyse the functions implemented in C language and implement the same in ARM assembly using NEON registers also compare the performance. We will also try to optimize it further if there's room for that. We started first with blend/blend_v/blend_h functions. AFAIK, I think these functions belongs to motion compensation and hence located in the 

```
src/mc_tmpl.c
```
and here's blend function

```
#define blend_px(a, b, m) (((a * (64 - m) + b * m) + 32) >> 6)
static void blend_c(pixel *dst, const ptrdiff_t dst_stride, const pixel *tmp, 
                        const int w, int h, const uint8_t *mask)
{
    do {
        for (int x = 0; x < w; x++) {
            dst[x] = blend_px(dst[x], tmp[x], mask[x]);
        }
        dst += PXSTRIDE(dst_stride);
        tmp += w;
        mask += w;
    } while (--h);
}
```
So as it's very clear that there are two loops, the inner loop is calling blend_px which is inturn executing

```
(((dst * (64 - mask) + tmp * mask) + 32) >> 6).
``` 

There are a total of 5 parameter which has been passed to the function. The final expression would be like.
```
dst = (((dst * (64 - mask) + tmp * mask) + 32) >> 6). 
```

One can imagine 2-D matrix where the inner loop is accessing the elements of a specific row and outer loop is iterating each row specific for each parameter(*dst, tmp and mask*). After operating on all the elements of a row, the leap to the next address of the row is done by following exp.

```
dst += PXSTRIDE(dst_stride);
tmp += w;
mask += w;
```
**Points to be Noted:**

- Evidently in the case of *dst* colums are contiguously placed in the memory but not rows, so the address of the next  row has to be updated after operating on all the row elements for a specific row.
- In case of *tmp* and *mask* we can infer that they are contiguosly placed in memory of both row and column wise.
- *w* is the length of each row and *h* is length column.

We will further look into the C function, while writing assembly code but these are all the highlights needed for now.

## <a name="SIMD:-The-Idea"></a> SIMD: The Idea

So to understand SIMD(single instruction multiple data) if you don't already know about it or didn't go through my previous blogs. The advantage over common assembly is we are going to fetch multiple data, keeping it in single register and do the operation with a single instruction.
 
So, for example, you have two 128bit registers, normally if you try to store any number in that register, it will be represented in 128 binary and then stored. For example, if you want to store 2 in 128bit register then register value will be 126 leading zeroes and 10 in the end. In case of SIMD you can divide the whole register into even parts so it can be used to keep multiple values like keeping 2 and 4 in the same register rather than using two different registers. Now you have a maximum of 128 bit register so either you can accommodate 16 8bit or 8 16bit or 4 32 bit or 2 64 bit data on either of the registers. 

### <a name="Instructions-in-SIMD"></a> Instructions in SIMD

In normal assembly if you have to add four elements of two different arrays lets say array size is four for both and store it in a third array

```
int a[4] = {1, 2, 3, 4};    // first array
int b[4] = {5, 6, 7, 8};    // second array
int c[4];                   // elements to be store after operation
```
so what one would do is 
```
for(int i = 0 ; i<4; i++)
    c[i] = a[i] + b[i];
```
assembly
```
loop:
    ldr     r2, [r0]!   // r0 -> address of a
    ldr     r3, [r1]!   // r1 -> address of b
    add     r4, r2, r3  // adding and storing into another register 
    str     r4, [r5]!   // r5 -> address of c
    subs    r6, r6, #1  // decrementing (intiially value of r6 is 4)
    bgt     loop        // if greater than zero then loop back
```

Now For a given case let's consider we can accommodate all the elements of *a* array(*if only size of the array is 128bit and if it's more, then might have to use another register which will also increase the instructions use to operate on the data; here in a and b there are only 4 elements each of 32bit so we can accomodate all in a 128 bit register*) in one register and all the elements of *b* in another, hence you can add 4 numbers in a single instruction and store it in another register correspondingly. Unlike in common assembly language, where you have to fetch a single 32 bit number and add it and then store, this will be repeated for 4 times.

SIMD:
```
    vld1.32     {q0}, [r0]!
    vld1.32     {q1}, [r1]!
    vadd.s32    q2, q0, q1
    vst1.32     {q2}, [r5]!
```
Hence we got rid of the inner loop and iterating through each element. That's the advantage of SIMD over normal assembly.

Now if you haven't noticed, elements of a and b were contiguously arranged and hence we were able to load it into a single register. So specific for widths of the data or the data about which we are sure that they would be contiguously arranged in the memory like an array, we have different implementations, it helps us to reduce extra reg and optimize it more to gain similar functionality over fewer instruction cycles. I will elaborate this further in later sections
 

## <a name="Declaring-NEON-ASM-Function"></a> Declaring NEON ASM Function

Before even implementing the function, we need to hook the asm function because till now it was using C implementation and with the availability of asm function, we need it to prioritize asm function over C. So we need to declare the function and hook it to the object. The concerned file would be

```
src/arm/mc_init_tmpl.c
```
In mc_inti_tmpl.c all the ASM functions for both 32 bit and 64 bit are declared

for example
  
```
decl_xyz_fn(dav1d_xyz_8bpc_neon);   # delcaring the function
c->xyz = dav1d_xyz_8bpc_neon;       # hooking to the c object
```
Now if your function is only supported for 32bit arch then you need add under a specific macro like
 
```
#if ARCH_ARM
    c->xyz = dav1d_xyz_8bpc_neon;
#endif
```

## <a name="Writing-NEON-ASM-Function-AARCH32"></a> Writing NEON ASM Function for AARCH32
Now we are ready to implement our assembly function. Definitition of function should be under something like
 
```
function xyz_8bpc_neon, export=1
```
which will export the function in the format of  **dav1d_xyz_8bpc_neon** exactly like how you declared the function in *src/arm/mc_init_tmpl.c*. 

### <a name="Jump-Table-AARCH32"></a> Jump Table for AARCH32

Now in the earlier sections we understood that we have specific code for specific widths which gauratees us that data has been arranged contiguously in the memory. So for example in blend function we form different subroutines for specific widths. So to know the value of width and select the right subroubtine we have a algorithm which maps w to the right implmentation.

Our function has the width parameter *w*, which will be having value of 2, 4, 8, 16, 32, 64 or 128. Now, we want to map this to a table index for the jump table. When we calculate leading zeroes(*clz()*) for say for 128 as a 32 bit value, we will get 24, because the 32 bit binary representation of 128, 0x00000080, has got 24 leading zeros.

When we do the same for 64, 0x0000000040, we get 25. With this, we map the w parameter values from the values 128, 64, 32, 16, 8, 4, 2, to values 0, 1, 2, 3, 4, 5, 6, which work as index into the jump table, to choose the right function implementation depending on the intended width.

```
if(r8 == 0)
{
    goto 128f
}
elseif (r8 == 1)
{
    goto 640f
}
```
Further more about jump table can be read [here](https://en.wikipedia.org/wiki/Branch_table)

For symbols like 40f, 40b etc I have refered the link [here](https://sourceware.org/binutils/docs/as/Symbol-Names.html#Symbol-Names).

Jump table for blend function is as follows:

```
        push            {r4-r5,lr}              // preserve registers
        ldr             r4,  [sp, #12]          // r4 <- h
        ldr             r5,  [sp, #16]          // r5 <- mask
        clz             lr,  r3                 // lr <- leading zeroes of w
        adr             r3,  L(blend_tbl)       // mov address of blend_tbl to r3 
        sub             lr,  lr,  #26           // lr <- lr - 26
        ldr             lr,  [r3, lr, lsl #2]   // since each entry is 4 bytes we multiply lr by 4
        add             r3,  r3,  lr            // offset is added to the address if blend_tbl
        bx              r3
```
Further below 
```
    .word 320f  - L(blend_tbl) + CONFIG_THUMB
 ```
 it's something like (32f - tbl) + tbl. 
 
 This kind of form is followed in all the functions in dav1d, in order to maintain the consistency and to work round some bugs in other tools in the case of AARCH32.
### <a name="Implementation-AARCH32"></a> Implmentation for AARCH32

So let's try write blend function in ARM assembly using NEON registers as we already analysed the C code and as the code is specific for different widths let's write for w = 4. Similar to the example above in SIMD section we are loading 4 values at a time. dst, tmp and mask are 0f 8 bit hence we can accommodate 4 values in 32 bits.

```
40:
        vmov.i8         d22, #64
4:
        vld1.32         {d2[]},     [r5]! // load mask
        vld1.32         {d1[]},     [r2]! // load tmp
        vld1.32         {d0[]},     [r0]  // load dst
        subs            r4,  r4,  #1      // h--
        vsub.i8         d3,  d22, d2      // 64 - mask
        vmull.u8        q8,  d1,  d2      // tmp * mask
        vmlal.u8        q8,  d0,  d3      // ((dst * (64 - mask)) + mask * tmp)
        vrshrn.i16      d20, q8,  #6      // (((dst * (64 - mask) ) + mask * tmp) + 32) >>6
        vst1.32         {d20[0]}, [r0], r1// dst = (((dst * (64 - mask) ) + mask * tmp) + 32) >>6; also update dst with next addr
        bgt             4b
        pop             {r4-r5,pc}
```
### <a name="Checkasm"></a> Checkasm and Benchmarking

Now that you have implmented the function, it's time to check if it's giving the right expected output and if so then try to benchmark it.

Checkasm is basically a tool which matches the C and ASM function's outputs, given the same random input. 
**Note**: each you make change to the code, you have build it again and check with the following commands.

```
~$ ninja -C build
~$ ./build/tests/checkasm
```
You can find test functions related to motion compensation under *tests/checkasm/mc.c*, these functions can be edited according to your need like you may wanna write function for w = 4 alone and have to check that so you can make the corresponding changes such that test function won't check for higher widths. If everything goes good it will show the below output

```
heckasm: using random seed 1250625806
NEON:
 - looprestoration_8bpc.wiener  [OK]
 - mc_8bpc.mc                   [OK]
 - mc_8bpc.mct                  [OK]
 - mc_8bpc.avg                  [OK]
 - mc_8bpc.w_avg                [OK]
 - mc_8bpc.mask                 [OK]
 - mc_8bpc.w_mask               [OK]
 - mc_8bpc.blend                [OK]
 - mc_8bpc.blend_v              [OK]
 - mc_8bpc.blend_h              [OK]
checkasm: all 574 tests passed
```
if something's wrong it will output like
```
  blend_w4_8bpc_neon (../tests/checkasm/mc.c:353)
 - mc_8bpc.blend                [FAILED]
```
and to see what's the expected output and what your fuction is giving, you need to *-v* with the command

```
~$ ./build/tests/checkasm -v
```
it will output something like
```
dst:
 26 84 76 c3     26 84 76 46    ...x
 7b 65 8a 8b     7b 65 6e 2f    ..xx
 a8 64 23 22     a8 64 20 1b    ..xx
 cb 9b 34 c4     cb 9b 31 14    ..xx
dst:
 e7 4b 7d 52     e7 4b 8f 51    ..xx
 49 b5 a9 a4     49 b5 ac 44    ..xx
 9b 93 82 a8     9b 93 5c 81    ..xx
 80 c2 52 85     80 c2 12 8d    ..xx
 2c 22 ba 70     2c 22 f4 05    ..xx
 a4 3b d8 66     a4 3b dd 4a    ..xx
 3f 9e dd ba     3f 9e b8 b2    ..xx
 5d b8 72 a5     5d b8 82 a5    ..x.
```
Where *'.'* denotes the values are matched and *'x'* denotes values didn't match. One can also use gdb for debugging but it's usually a time consuming process.

After the fixing the issue, to benchmark the function the following command can be executed.
```
~$ ./build/tests/checkasm  -v --bench=blend
```
By default this will execute code on A73 but if you want the code to run A53 only, it can be dont with 
```
taskset -c 0 ./build/tests/checkasm -v --bench=blend
```
Which will output, this will only work if you have accessed the counter registers correctly.
```
blend_w4_8bpc_c: 201.2
blend_w4_8bpc_neon: 49.8
```
Now here we can clearly see that our code is 5 times efficient than c code. 

### <a name="Optimization-AARCH32"></a> Optimization for AARCH32

Although our code is efficient, we can further increase the efficiency by optimizing the code. 

In the project I have touched 3 aspects of optimization.

1. Loop Unrolling
2. Instruction reordering
3. Memory Alignment

### <a name="Loop-Unrolling"></a> Loop Unrolling

For example we have a loop
```
for(int i=0 ; i<n ; i++)
{
    // some exp
}
```
Now the exp would be set of instruction in program memory and to re-execute those set of instruction, PC(pogram counter) has to be reset to the same instruction and this has to be done n times after executing the code each time. So in a way branching is expensive than sequentially executing the program in most of the cases, branching certainly takes more instruction cycles(*takes extra instruction cycles to pop the address of the instruction from the stack and write to the PC*). So now we can't write that exp n times but can reduce branching.
```
for(int i=0 ; i<n ; i+=2)
{
    // some exp
    // repeat the above exp
}
```
Also this gives us room to reoder structure and make the code more optimized.

Let's try this in blend above blend function

```
40:
        vmov.i8         d22, #64        
        add             r12, r0,  r1    // next stride dst += PXSTRIDE(dst_stride)
        lsl             r1,  r1,  #1    
4:
        vld1.u8         {d2},     [r5]! // loading 8 16bit values i.e two strides together
        vld1.u8         {d1},     [r2]!
        vld1.32         {d0[]},   [r0]
        vld1.32         {d0[1]},  [r12]
        subs            r4,  r4,  #2    
        vsub.i8         d3,  d22, d2    
        vmull.u8        q8,  d1,  d2    
        vmlal.u8        q8,  d0,  d3    
        vrshrn.i16      d20, q8,  #6    
        vst1.32         {d20[0]}, [r0], r1        
        vst1.32         {d20[1]}, [r12], r1        
        bgt             4b     
        pop             {r4-r5,pc}   
```
Now let's benchmark and compare with the previous one

```
Now:
blend_w4_8bpc_neon: 34.3
Earlier
blend_w4_8bpc_neon: 49.8
```
As you can see there's significant amount affect.

### <a name="Instruction-Reordering"></a> Instruction Reordering 

For example

```
a = b + c;
d = a + b;
c = c + 1;
```
Now as you can see in first expression, a is getting updated and used in the second. So second experssion can't be executed until first expression gets executed. Therefore this set of instrusctions can be reordered as 
```
a = b + c;
c = c + 1;
d = a + b;
```
Again this has been more affective on A53 than A73.

Let's try this in blend function

```
40:
        vmov.i8         d22, #64        
        add             r12, r0,  r1    
        lsl             r1,  r1,  #1    
4:
        vld1.u8         {d2},     [r5,  :64]!
        vld1.u8         {d1},     [r2,  :64]!
        vld1.32         {d0[]},   [r0,  :32]
        subs            r4,  r4,  #2    
        vld1.32         {d0[1]},  [r12, :32]
        vsub.i8         d3,  d22, d2    
        vmull.u8        q8,  d1,  d2    
        vmlal.u8        q8,  d0,  d3    
        vrshrn.i16      d20, q8,  #6    
        vst1.32         {d20[0]}, [r0,  :32], r1        
        vst1.32         {d20[1]}, [r12, :32], r1        
        bgt             4b     
        pop             {r4-r5,pc}      
```
and now let's compare the benchmarks
```
Now
blend_w4_8bpc_neon: 33.5
Earlier
blend_w4_8bpc_neon: 34.3
```
There's hasn't been great difference but as you proceed to higher widths there will be room for more reordering, in this case we had enough registers and also latency issues didn't pop here. only in the vmull/vmlal/vrshrn which can't help. 

As another example for w = 8 case
```
80:
        vmov.i8         d16, #64
        add             r12, r0,  r1
        lsl             r1,  r1,  #1
8:
        vld1.u8         {q1},  [r5,  :128]!
        vld1.u8         {q2},  [r2,  :128]!
        vld1.u8         {d0},  [r0,  :64]
        vsub.i8         d17, d16, d2
        vld1.u8         {d1},  [r12, :64]
        subs            r4,  r4,  #2
        vsub.i8         d18, d16, d3
        vmull.u8        q3,  d2,  d4
        vmlal.u8        q3,  d0,  d17
        vmull.u8        q10, d3,  d5
        vmlal.u8        q10, d1,  d18
        vrshrn.i16      d22, q3,  #6
        vrshrn.i16      d23, q10, #6
        vst1.u8         {d22}, [r0,  :64], r1
        vst1.u8         {d23}, [r12, :64], r1
        bgt             8b
        pop             {r4-r5,pc}
```

as you can see we haven't ordered instructions like 

```
        vmull.u8        q3,  d2,  d4
        vmlal.u8        q3,  d0,  d17
        vrshrn.i16      d22, q3,  #6
        vmull.u8        q10, d3,  d5
        vmlal.u8        q10, d1,  d18
        vrshrn.i16      d23, q10, #6
```
reason being q3 gets update in vmlal and then if we keep vrsrhn just after that may have to wait for q3 to get update and then only it can be executed. Hence we kept at the end as far as possible.

### <a name="Memory-Alignment"></a> Memory Alignment

For example
```
vld1.u8         {q2,  q3},  [r5,  :128]!
```
can also be written as

```
vld1.u8         {q2,  q3},  [r5]!
```

But the later pretty much uses more instruction cycles than the before. Memory alignment  gaurantees that memory will be aligned by so and so bits. This was only affective on A8 and A9 and not on A53 and A73.

## <a name="From-AARCH32-to-AARCH64"></a> From AARCH32 to AARCH64

The code for 32 bit and 64 bit is almost exactly same except there is no overlapping like q and d registers and there are more register than in AARCH32 with a bit different naming scheme. In 64 bit Jump table is placed in the end and something like and it happened to be different than AARCH32.

 ```
    .hword L(blend_tbl) - 32b
```
which is tbl - (tbl - 32b). Where tbl has the address. tbl is placed in the and end for a higher value that's why the expression is like subtracting 32b from tbl.

There been a doc very useful for understanding 64bit, download link is [here](https://www.element14.com/community/servlet/JiveServlet/previewBody/41836-102-1-229511/ARM.Reference_Manual.pdf). You can search of instruction fopr AARCH64 corresponding to AARCH32. ARM assembler reference manual can be downloaded from [here](http://infocenter.arm.com/help/topic/com.arm.doc.dui0489c/DUI0489C_arm_assembler_reference.pdf).

For an example blend's 64 bit for w=4 is as follows
```
function blend_8bpc_neon, export=1
        adr             x6,  L(blend_tbl)
        clz             w3,  w3
        sub             w3,  w3,  #26
        ldrh            w3,  [x6,  x3,  lsl #1]
        sub             x6,  x6,  w3,  uxtw
        movi            v4.16b,  #64
        add             x8,  x0,  x1
        lsl             w1,  w1,  #1
        br              x6
4:
        ld1             {v2.d}[0],   [x5],  #8
        ld1             {v1.d}[0],   [x2],  #8
        ld1             {v0.s}[0],   [x0]
        subs            w4,  w4,  #2
        ld1             {v0.s}[1],   [x8]
        sub             v3.8b,   v4.8b,   v2.8b
        umull           v5.8h,   v1.8b,   v2.8b
        umlal           v5.8h,   v0.8b,   v3.8b
        rshrn           v6.8b,   v5.8h,   #6
        st1             {v6.s}[0],   [x0],  x1
        st1             {v6.s}[1],   [x8],  x1
        b.gt            4b
        ret
```
## <a name="List-of-Commits"></a> List of Commits

Here's the list and details of all commits. I have completed w_mask_444/420/422 and blend/blend_h/blend_v for both AARCH32 and AARCH64 architecture and they are succssfully merged.

***added lines: 1543, removed lines: 272, total lines: 1271***


|    Commit&nbsp;&nbsp;&nbsp;&nbsp;| Commit message |Files Changed|&nbsp;&nbsp;Insertions /Deletions |
|:-------------:|-------------------|:----:|:----:|
|[3d94fb9](https://code.videolan.org/krish-iyer/dav1d/commit/3d94fb9aff5d2837c9ee0c13fff3d4e2424623ae)|arm64: mc: NEON implementation of w_mask_444/422/420 function|2|(+255) (-4)|
|[1dc2dc7](https://code.videolan.org/krish-iyer/dav1d/commit/1dc2dc7d27bd0075684945b00b3539be429886aa)|arm64: mc: NEON implementation of blend, blend_h and blend_v function|2|(+410) (-3)|
|[b0d0002](https://code.videolan.org/videolan/dav1d/commit/b0d00020e06a3528977b977c61a252e91969b1a0)|arm: mc: Speed up due to memory alignment in ldr/str instructions|2|(+104)(-104)|
|[407c27d](https://code.videolan.org/videolan/dav1d/commit/407c27db02c7ed1732d1fe2a3e89e54bd29427ef)|arm: mc: neon: Merge load and other related operations in blend/blend_h/blend_v functions|1|(+79) (-97)|
|[d4df861](https://code.videolan.org/videolan/dav1d/commit/d4df861993010586fdf61794f12ae923891872ac)|arm: mc: neon: Reduce usage of general purpose registers in blend/blend_v functions|1|(+26) (-27)|
|[b704a99](https://code.videolan.org/videolan/dav1d/commit/b704a993f61b1b07b1f3ac478935992239383084)|arm: mc: neon: Use vld with ! post-increment instead of a register in blend/blend_h/blend_v function|1|(+32) (-31)|
|[b271590](https://code.videolan.org/videolan/dav1d/commit/b271590aae34d3aa802d2e401b0c051ac4b4eeba)|arm: mc: NEON implementation of w_mask_444/422/420 function|2|(+242) (-0)|
|[632b487](https://code.videolan.org/videolan/dav1d/commit/632b4876e3869aea085427cc79f5d08487d848de)|arm: mc: neon: Improvement in blend_v function|1|(+3) (-6)|
|[a1e3f35](https://code.videolan.org/videolan/dav1d/commit/a1e3f35842de92b526422af05360c84cf233f07f)|arm:mc: NEON implementation of blend, blend_h and blend_v function|2|(+422) (-0)|

## <a name="#What's-Left-out"></a> What's Left out!

Here's a [list](https://code.videolan.org/videolan/dav1d/issues/215) of functions to be implemented in ARM. I would like to continue with VideoLAN and my first goal would be to port warp8x8 functiom from AARCH64 to AARCH32. 

##  <a name="Final-Note-and-Things-I-learnt"></a> Final Note and Things I learnt

It has been a great journey and a steep learning curve in my career. Right from the first email to VideoLAN, they were very patient, I have started learning ARM assembly from February'19 and with the right guidance, we were able to produce quality code. Following things I leant throughout the project

1. ARM assembly with NEON architecture for both 32 and 64 bit
2. Understanding of dav1d codebase
3. Complete the tasks on time
4. Understand and respond in the review process 
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { HastrologyProgram } from "../target/types/hastrology_program";
import { assert, use } from "chai";
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction, ComputeBudgetProgram } from "@solana/web3.js";
import { confirmTransaction } from "@solana-developers/helpers";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("hastrology_program", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  const program = anchor.workspace.hastrologyProgram as Program<HastrologyProgram>;

  const authority = Keypair.generate();
  const platformWallet = new PublicKey("12uBq3Qhvd1fJ8JsXoUosmzhnrM59TTGUgtdLru5wBUM");
  let platformWalletKey: PublicKey;
  let lotteryStatePda: PublicKey;
  let potVaultPda: PublicKey;
  
  const ticketPrice = new anchor.BN(LAMPORTS_PER_SOL/2); 
  const platformFeeBps = 100; 
  let firstLotteryEndtime: BN;

  let user1: Keypair;
  let user2: Keypair;

  before(async () => {
    firstLotteryEndtime = new anchor.BN(Math.floor(Date.now() / 1000) + 30);

    [lotteryStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("lottery_state")],
      program.programId
    );

    [potVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pot_vault")],
      program.programId
    );
    user1 = Keypair.generate();
    user2 = Keypair.generate();

    // // await airdrop(connection, authority.publicKey, 2);
    // // await airdrop(connection, user1.publicKey, 2);
    // // await airdrop(connection, user2.publicKey, 2);
    // await airdrop_fund(connection,authority , [user1.publicKey, user2.publicKey], 1 * LAMPORTS_PER_SOL);
  })

  it("Initializes the lottery state!", async () => {
    const stateAccount = await connection.getAccountInfo(lotteryStatePda);

    if (stateAccount === null) {
      console.log("Lottery state not found, initializing...");

      await program.methods
        .initialize(
          platformWallet,
          ticketPrice,
          platformFeeBps,
          firstLotteryEndtime
        )
        .accountsStrict({
          authority: authority.publicKey,
          lotteryState: lotteryStatePda,
          potVault: potVaultPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
      console.log("Lottery state initialized.");

      platformWalletKey = platformWallet;
    } else {
      console.log("Lottery state already initialized, skipping.");

      const state = await program.account.lotteryState.fetch(lotteryStatePda);
      platformWalletKey = state.platformWallet;
      console.log(`Using existing platform wallet: ${platformWalletKey.toString()}`);
    }

    const state = await program.account.lotteryState.fetch(lotteryStatePda);

    assert.ok(state.authority.equals(authority.publicKey));
    assert.ok(state.potVault.equals(potVaultPda));
    assert.ok(state.platformWallet.equals(platformWalletKey));
    assert.equal(state.platformFeeBps, platformFeeBps);
    assert.ok(state.ticketPrice.eq(ticketPrice));
    assert.ok(state.currentLotteryId.eq(new anchor.BN(1)));
    assert.ok(state.totalParticipants.eq(new anchor.BN(0)));
    assert.equal(state.isDrawing, false);
    assert.ok(state.lotteryEndtime.eq(firstLotteryEndtime));
    // console.log(`LOTTERY end time: ${firstLotteryEndtime} and current time: ${Math.floor(Date.now() / 1000)}`);
  });

  // it("Reset the lottery state!", async () => {
  //   const stateAccount = await provider.connection.getAccountInfo(lotteryStatePda);

  //     console.log(stateAccount);

  //     await program.methods
  //       .reset()
  //       .accountsStrict({
  //         authority: authority.publicKey,
  //         lotteryState: lotteryStatePda,
  //         systemProgram: SystemProgram.programId,
  //       })
  //       .preInstructions([
  //         ComputeBudgetProgram.setComputeUnitPrice({
  //           microLamports: 5000,
  //         })
  //       ])
  //       .signers([authority])
  //       .rpc();
  //     console.log("Lottery state reset.");

  //     platformWalletKey = platformWallet;

  //   const state = await program.account.lotteryState.fetch(lotteryStatePda);
  //   console.log("state: ", state);

  //   assert.ok(state.authority.equals(authority.publicKey));
  //   assert.ok(state.potVault.equals(potVaultPda));
  //   assert.ok(state.platformWallet.equals(platformWalletKey));
  //   assert.equal(state.platformFeeBps, platformFeeBps);
  //   assert.ok(state.ticketPrice.eq(ticketPrice));
  //   // assert.ok(state.currentLotteryId.eq(new anchor.BN(1)));
  //   assert.ok(state.totalParticipants.eq(new anchor.BN(0)));
  //   assert.equal(state.isDrawing, false);
  //   // assert.ok(state.lotteryEndtime.eq(firstLotteryEndtime));
  //   console.log(`LOTTERY end time: ${firstLotteryEndtime} and current time: ${Math.floor(Date.now() / 1000)}`);
  // });

  it("Allows user1 to enter the lottery", async () => {
    const stateBefore = await program.account.lotteryState.fetch(lotteryStatePda);
    const currentLotteryId = stateBefore.currentLotteryId;
    // console.log("current lottery id: ",currentLotteryId);
    const totalParticipants = stateBefore.totalParticipants;

    const [userEntryReceiptPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-receipt"),
        user1.publicKey.toBuffer(),
        currentLotteryId.toBuffer("le", 8), 
      ],
      program.programId
    );
    
    const [userTicketPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-ticket"),
        currentLotteryId.toBuffer("le", 8),
        totalParticipants.toBuffer("le", 8), 
      ],
      program.programId
    );
    // console.log("user1 entry receipt: ", userTicketPda);


    const userBalanceBefore = await provider.connection.getBalance(user1.publicKey);
    const vaultBalanceBefore = await provider.connection.getBalance(potVaultPda);


    const sig = await program.methods
      .enterLottery()
      .accountsStrict({
        user: user1.publicKey,
        lotteryState: lotteryStatePda,
        potVault: potVaultPda,
        userEntryReceipt: userEntryReceiptPda,
        userTicket: userTicketPda,
        systemProgram: SystemProgram.programId,
      })
      .preInstructions([
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 5000,
          })
        ])
      .signers([user1]) 
      .rpc();


    const stateAfter = await program.account.lotteryState.fetch(lotteryStatePda);
    assert.ok(stateAfter.totalParticipants.eq(new anchor.BN(1)));

    const receipt = await program.account.userEntryReceipt.fetch(userEntryReceiptPda);
    assert.ok(receipt.user.equals(user1.publicKey));
    assert.ok(receipt.lotteryId.eq(currentLotteryId));
    // assert.ok(receipt.ticketNumber.eq(totalParticipants)); 

    const ticket = await program.account.userTicket.fetch(userTicketPda);
    assert.ok(ticket.user.equals(user1.publicKey));
    assert.ok(ticket.lotteryId.eq(currentLotteryId));
    assert.equal(ticket.isWinner, false);
    assert.equal(ticket.isClaimed, false); 
    assert.ok(ticket.prizeAmount.eq(new anchor.BN(0))); 

    const vaultBalanceAfter = await provider.connection.getBalance(potVaultPda);
    const userBalanceAfter = await provider.connection.getBalance(user1.publicKey);
    
    assert.equal(vaultBalanceAfter, vaultBalanceBefore + ticketPrice.toNumber());
    assert.isTrue(userBalanceAfter < userBalanceBefore - ticketPrice.toNumber());
  })

  it("Allows user2 to enter the lottery", async () => {
    const stateBefore = await program.account.lotteryState.fetch(lotteryStatePda);
    const currentLotteryId = stateBefore.currentLotteryId;
    const totalParticipants = stateBefore.totalParticipants;

    const [userEntryReceiptPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-receipt"),
        user2.publicKey.toBuffer(),
        currentLotteryId.toBuffer("le", 8), 
      ],
      program.programId
    );

    const [userTicketPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-ticket"),
        currentLotteryId.toBuffer("le", 8),
        totalParticipants.toBuffer("le", 8), 
      ],
      program.programId
    );


    const userBalanceBefore = await provider.connection.getBalance(user2.publicKey);
    const vaultBalanceBefore = await provider.connection.getBalance(potVaultPda);


    const sig = await program.methods
      .enterLottery()
      .accountsStrict({
        user: user2.publicKey,
        lotteryState: lotteryStatePda,
        potVault: potVaultPda,
        userEntryReceipt: userEntryReceiptPda,
        userTicket: userTicketPda,
        systemProgram: SystemProgram.programId,
      })
      .preInstructions([
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 5000,
          })
        ])
      .signers([user2]) 
      .rpc();


    const stateAfter = await program.account.lotteryState.fetch(lotteryStatePda);
    assert.ok(stateAfter.totalParticipants.eq(new anchor.BN(2)));

    const receipt = await program.account.userEntryReceipt.fetch(userEntryReceiptPda);
    assert.ok(receipt.user.equals(user2.publicKey));
    assert.ok(receipt.lotteryId.eq(currentLotteryId));
    // assert.ok(receipt.ticketNumber.eq(totalParticipants)); 

    const ticket = await program.account.userTicket.fetch(userTicketPda);
    assert.ok(ticket.user.equals(user2.publicKey));
    assert.ok(ticket.lotteryId.eq(currentLotteryId));
    assert.equal(ticket.isWinner, false);
    assert.equal(ticket.isClaimed, false); 
    assert.ok(ticket.prizeAmount.eq(new anchor.BN(0))); 

    const vaultBalanceAfter = await provider.connection.getBalance(potVaultPda);
    const userBalanceAfter = await provider.connection.getBalance(user2.publicKey);
    
    assert.equal(vaultBalanceAfter, vaultBalanceBefore + ticketPrice.toNumber());
    assert.isTrue(userBalanceAfter < userBalanceBefore - ticketPrice.toNumber());
  })

  // it("Reques Draw on testnet", async () => {
  //   await sleep(10000);
  //   const sig = await program.methods
  //     .requestDraw()
  //     .accountsPartial({
  //       authority: authority.publicKey,
  //       lotteryState: lotteryStatePda
  //     })
  //     .signers([authority]) 
  //     .rpc();


  //   const stateAfter = await program.account.lotteryState.fetch(lotteryStatePda);
  //   console.log(stateAfter.winner);
  // })

  it("Requests a draw and waits for resolution", async () => {
    const stateBefore = await program.account.lotteryState.fetch(lotteryStatePda);
    await sleep(30000);
    console.log("State before: isDrawing =", stateBefore.isDrawing);
    const sig = await program.methods.requestDraw()
      .accountsPartial({
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    console.log("Request sent! TX:", sig);

    await sleep(10000);
    // const stateafter = await program.account.lotteryState.fetch(lotteryStatePda);
    // console.log(stateafter.winner);
  });


  it("Payouts to the winner", async () => {
    const state = await program.account.lotteryState.fetch(lotteryStatePda);
    console.log(state);
    
    const currentLotteryId = state.currentLotteryId;
    const winningIndex = state.winner;
    
    console.log("Official Winner Index:", winningIndex.toString());

    const [winningTicketPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user-ticket"),
        currentLotteryId.toBuffer("le", 8),
        winningIndex.toBuffer("le", 8),
      ],
      program.programId
    );

    const ticketAccount = await program.account.userTicket.fetch(winningTicketPda);
    const winnerPubkey = ticketAccount.user;
    
    console.log("Winner Wallet:", winnerPubkey.toBase58());

    const potBalanceBefore = await provider.connection.getBalance(potVaultPda);
    const platformBalanceBefore = await provider.connection.getBalance(platformWallet);
    const winnerBalanceBefore = await provider.connection.getBalance(winnerPubkey);

    console.log(`pot balance before: ${potBalanceBefore / LAMPORTS_PER_SOL}, platform wallet before: ${platformBalanceBefore / LAMPORTS_PER_SOL}`);

    console.log(`winner balance before: ${winnerBalanceBefore / LAMPORTS_PER_SOL}`);

    await program.methods
      .payout() 
      .accountsPartial({
        authority: authority.publicKey,
        lotteryState: lotteryStatePda,
        platformWallet: platformWallet,
        winner: winnerPubkey,
        potVault: potVaultPda,
        systemProgram: SystemProgram.programId,
      })
      .preInstructions([
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 5000,
          })
        ])
      .signers([authority])
      .rpc();

    const potBalanceAfter = await provider.connection.getBalance(potVaultPda);
    const platformBalanceAfter = await provider.connection.getBalance(platformWallet);
    const winnerBalanceAfter = await provider.connection.getBalance(winnerPubkey);

    console.log(`pot balance After: ${potBalanceAfter / LAMPORTS_PER_SOL}, platform wallet After: ${platformBalanceAfter / LAMPORTS_PER_SOL}`);
    console.log(`winner balance after: ${winnerBalanceAfter / LAMPORTS_PER_SOL}`);

    console.log("Pot emptied?", potBalanceAfter === 0);
    assert.strictEqual(potBalanceAfter, 0);
    assert.isTrue(winnerBalanceAfter > winnerBalanceBefore);
  });

  // after(async () => {
  //   const balance1 = await connection.getBalance(user1.publicKey);
  //   if (balance1 > 5000) {
  //       await defundAccount(connection, user1, authority.publicKey, balance1 - 5000);
  //   }

  //   const balance2 = await connection.getBalance(user2.publicKey);
  //   if (balance2 > 5000) {
  //       await defundAccount(connection, user2, authority.publicKey, balance2 - 5000);
  //   }
  // })

});

async function airdrop(connection: Connection, address: PublicKey, amount: number) {
    let airdrop_signature = await connection.requestAirdrop(
      address,
      amount * LAMPORTS_PER_SOL
    );

  await confirmTransaction(connection, airdrop_signature, "confirmed");
}

async function airdrop_fund(
  connection: Connection,
  funder: Keypair,
  to: PublicKey[],
  lamports: number = LAMPORTS_PER_SOL
) {
  const ixs = to.map((pubkey) => {
    return SystemProgram.transfer({
      fromPubkey: funder.publicKey,
      toPubkey: pubkey,
      lamports,
    });
  });
  const tx = new Transaction().add(...ixs);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = funder.publicKey;
  await sendAndConfirmTransaction(connection, tx, [funder]);
}

export async function defundAccount(
  connection: Connection,
  funder: Keypair,
  to: PublicKey,
  lamports: number
) {
  const balance = await connection.getBalance(funder.publicKey);
  
  // Increase buffer to 50,000 to cover base fee + priority fee
  const FEE_BUFFER = 50000; 

  if (balance > FEE_BUFFER) {
    // 1. Add High Priority Fee
    const priorityIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 100000, // High priority for cleanup
    });

    // 2. Calculate transferable amount (Account Balance - Buffer)
    const transferAmount = balance - FEE_BUFFER;

    const transferIx = SystemProgram.transfer({
      fromPubkey: funder.publicKey,
      toPubkey: to,
      lamports: transferAmount,
    });

    const tx = new Transaction().add(priorityIx, transferIx);
    
    // 3. Fetch latest blockhash with 'confirmed' commitment
    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = funder.publicKey;

    try {
        await sendAndConfirmTransaction(connection, tx, [funder], {
            commitment: 'confirmed',
            maxRetries: 3, // Retry a few times if it drops
        });
        console.log(`Defunded ${funder.publicKey.toBase58()} successfully.`);
    } catch (e) {
        console.error(`Failed to defund ${funder.publicKey.toBase58()}:`, e);
        // We catch here so the test suite doesn't fail just because cleanup failed
    }
  }
}
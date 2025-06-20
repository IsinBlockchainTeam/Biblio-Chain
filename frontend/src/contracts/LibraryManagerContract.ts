/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "./common";

export interface LibraryManagerContractInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "approveProposal"
      | "areAllPaused"
      | "banUser"
      | "bookFactory"
      | "borrowBook"
      | "buyBook"
      | "canExecuteProposal"
      | "createRentableBook"
      | "createSellableBook"
      | "getAllBookIds"
      | "getAllUsers"
      | "getBookDetails"
      | "getBookIdsPaginated"
      | "getBookRating"
      | "getPendingProposals"
      | "getProposalInfo"
      | "getTotalBooks"
      | "getTotalUsers"
      | "getUserInfo"
      | "governance"
      | "hasUserRatedBook"
      | "hasVoted"
      | "initialize"
      | "isOperationPaused"
      | "pausableController"
      | "pauseAll"
      | "pauseOperation"
      | "proposeAddOwner"
      | "proposeRemoveOwner"
      | "rateRentableBook"
      | "rateSellableBook"
      | "registerUser"
      | "rejectProposal"
      | "returnBook"
      | "setReturnerRewardPercentage"
      | "unbanUser"
      | "unpauseAll"
      | "unpauseOperation"
      | "userSystem"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "BookBorrowed"
      | "BookCreated"
      | "BookPurchased"
      | "BookRated"
      | "BookReturned"
      | "BookReturnedByThirdParty"
      | "ProposalRejected"
      | "UserRegistered"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "approveProposal",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "areAllPaused",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "banUser",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "bookFactory",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "borrowBook",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "buyBook",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "canExecuteProposal",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "createRentableBook",
    values: [string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "createSellableBook",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getAllBookIds",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getAllUsers",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getBookDetails",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getBookIdsPaginated",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getBookRating",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getPendingProposals",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getProposalInfo",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getTotalBooks",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getTotalUsers",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getUserInfo",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "governance",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "hasUserRatedBook",
    values: [BigNumberish, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "hasVoted",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values: [AddressLike, AddressLike, AddressLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "isOperationPaused",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "pausableController",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "pauseAll", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "pauseOperation",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "proposeAddOwner",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "proposeRemoveOwner",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "rateRentableBook",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "rateSellableBook",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "registerUser",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "rejectProposal",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "returnBook",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setReturnerRewardPercentage",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "unbanUser",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "unpauseAll",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "unpauseOperation",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "userSystem",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "approveProposal",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "areAllPaused",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "banUser", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "bookFactory",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "borrowBook", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "buyBook", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "canExecuteProposal",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createRentableBook",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createSellableBook",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAllBookIds",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAllUsers",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getBookDetails",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getBookIdsPaginated",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getBookRating",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getPendingProposals",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getProposalInfo",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTotalBooks",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTotalUsers",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getUserInfo",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "governance", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "hasUserRatedBook",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "hasVoted", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "isOperationPaused",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "pausableController",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "pauseAll", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "pauseOperation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "proposeAddOwner",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "proposeRemoveOwner",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "rateRentableBook",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "rateSellableBook",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "registerUser",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "rejectProposal",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "returnBook", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setReturnerRewardPercentage",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "unbanUser", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "unpauseAll", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "unpauseOperation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "userSystem", data: BytesLike): Result;
}

export namespace BookBorrowedEvent {
  export type InputTuple = [tokenId: BigNumberish, borrower: AddressLike];
  export type OutputTuple = [tokenId: bigint, borrower: string];
  export interface OutputObject {
    tokenId: bigint;
    borrower: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace BookCreatedEvent {
  export type InputTuple = [tokenId: BigNumberish, bookType: BigNumberish];
  export type OutputTuple = [tokenId: bigint, bookType: bigint];
  export interface OutputObject {
    tokenId: bigint;
    bookType: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace BookPurchasedEvent {
  export type InputTuple = [
    tokenId: BigNumberish,
    buyer: AddressLike,
    seller: AddressLike
  ];
  export type OutputTuple = [tokenId: bigint, buyer: string, seller: string];
  export interface OutputObject {
    tokenId: bigint;
    buyer: string;
    seller: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace BookRatedEvent {
  export type InputTuple = [
    tokenId: BigNumberish,
    rater: AddressLike,
    rating: BigNumberish
  ];
  export type OutputTuple = [tokenId: bigint, rater: string, rating: bigint];
  export interface OutputObject {
    tokenId: bigint;
    rater: string;
    rating: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace BookReturnedEvent {
  export type InputTuple = [tokenId: BigNumberish, borrower: AddressLike];
  export type OutputTuple = [tokenId: bigint, borrower: string];
  export interface OutputObject {
    tokenId: bigint;
    borrower: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace BookReturnedByThirdPartyEvent {
  export type InputTuple = [
    tokenId: BigNumberish,
    returner: AddressLike,
    borrower: AddressLike
  ];
  export type OutputTuple = [
    tokenId: bigint,
    returner: string,
    borrower: string
  ];
  export interface OutputObject {
    tokenId: bigint;
    returner: string;
    borrower: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace ProposalRejectedEvent {
  export type InputTuple = [proposalId: BigNumberish, rejecter: AddressLike];
  export type OutputTuple = [proposalId: bigint, rejecter: string];
  export interface OutputObject {
    proposalId: bigint;
    rejecter: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace UserRegisteredEvent {
  export type InputTuple = [user: AddressLike];
  export type OutputTuple = [user: string];
  export interface OutputObject {
    user: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface LibraryManagerContract extends BaseContract {
  connect(runner?: ContractRunner | null): LibraryManagerContract;
  waitForDeployment(): Promise<this>;

  interface: LibraryManagerContractInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  approveProposal: TypedContractMethod<
    [proposalId: BigNumberish],
    [void],
    "nonpayable"
  >;

  areAllPaused: TypedContractMethod<[], [boolean], "view">;

  banUser: TypedContractMethod<[user: AddressLike], [void], "nonpayable">;

  bookFactory: TypedContractMethod<[], [string], "view">;

  borrowBook: TypedContractMethod<[tokenId: BigNumberish], [void], "payable">;

  buyBook: TypedContractMethod<[tokenId: BigNumberish], [void], "payable">;

  canExecuteProposal: TypedContractMethod<
    [proposalId: BigNumberish],
    [boolean],
    "view"
  >;

  createRentableBook: TypedContractMethod<
    [
      ipfsMetadata: string,
      depositAmount: BigNumberish,
      lendingPeriod: BigNumberish
    ],
    [bigint],
    "nonpayable"
  >;

  createSellableBook: TypedContractMethod<
    [ipfsMetadata: string, price: BigNumberish],
    [bigint],
    "nonpayable"
  >;

  getAllBookIds: TypedContractMethod<[], [bigint[]], "view">;

  getAllUsers: TypedContractMethod<[], [string[]], "view">;

  getBookDetails: TypedContractMethod<
    [tokenId: BigNumberish],
    [
      [string, bigint, string] & {
        contractAddress: string;
        bookType: bigint;
        bookData: string;
      }
    ],
    "view"
  >;

  getBookIdsPaginated: TypedContractMethod<
    [offset: BigNumberish, limit: BigNumberish],
    [bigint[]],
    "view"
  >;

  getBookRating: TypedContractMethod<
    [tokenId: BigNumberish],
    [[bigint, bigint] & { avgRating: bigint; count: bigint }],
    "view"
  >;

  getPendingProposals: TypedContractMethod<[], [bigint[]], "view">;

  getProposalInfo: TypedContractMethod<
    [proposalId: BigNumberish],
    [
      [bigint, bigint, string, string, bigint, bigint] & {
        id: bigint;
        proposalType: bigint;
        target: string;
        proposer: string;
        approvalCount: bigint;
        rejectionCount: bigint;
      }
    ],
    "view"
  >;

  getTotalBooks: TypedContractMethod<[], [bigint], "view">;

  getTotalUsers: TypedContractMethod<[], [bigint], "view">;

  getUserInfo: TypedContractMethod<
    [user: AddressLike],
    [
      [boolean, boolean, bigint, boolean] & {
        isRegistered: boolean;
        isBanned: boolean;
        trustLevel: bigint;
        isSystemOwner: boolean;
      }
    ],
    "view"
  >;

  governance: TypedContractMethod<[], [string], "view">;

  hasUserRatedBook: TypedContractMethod<
    [tokenId: BigNumberish, user: AddressLike],
    [boolean],
    "view"
  >;

  hasVoted: TypedContractMethod<[proposalId: BigNumberish], [boolean], "view">;

  initialize: TypedContractMethod<
    [
      userSystemAddress: AddressLike,
      governanceAddress: AddressLike,
      bookFactoryAddress: AddressLike,
      pausableControllerAddress: AddressLike
    ],
    [void],
    "nonpayable"
  >;

  isOperationPaused: TypedContractMethod<
    [operationType: BigNumberish],
    [boolean],
    "view"
  >;

  pausableController: TypedContractMethod<[], [string], "view">;

  pauseAll: TypedContractMethod<[], [void], "nonpayable">;

  pauseOperation: TypedContractMethod<
    [operationType: BigNumberish],
    [void],
    "nonpayable"
  >;

  proposeAddOwner: TypedContractMethod<
    [newOwner: AddressLike],
    [bigint],
    "nonpayable"
  >;

  proposeRemoveOwner: TypedContractMethod<
    [owner: AddressLike],
    [bigint],
    "nonpayable"
  >;

  rateRentableBook: TypedContractMethod<
    [tokenId: BigNumberish, rating: BigNumberish],
    [void],
    "nonpayable"
  >;

  rateSellableBook: TypedContractMethod<
    [tokenId: BigNumberish, rating: BigNumberish],
    [void],
    "nonpayable"
  >;

  registerUser: TypedContractMethod<[], [void], "nonpayable">;

  rejectProposal: TypedContractMethod<
    [proposalId: BigNumberish],
    [void],
    "nonpayable"
  >;

  returnBook: TypedContractMethod<
    [tokenId: BigNumberish],
    [void],
    "nonpayable"
  >;

  setReturnerRewardPercentage: TypedContractMethod<
    [percentage: BigNumberish],
    [void],
    "nonpayable"
  >;

  unbanUser: TypedContractMethod<[user: AddressLike], [void], "nonpayable">;

  unpauseAll: TypedContractMethod<[], [void], "nonpayable">;

  unpauseOperation: TypedContractMethod<
    [operationType: BigNumberish],
    [void],
    "nonpayable"
  >;

  userSystem: TypedContractMethod<[], [string], "view">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "approveProposal"
  ): TypedContractMethod<[proposalId: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "areAllPaused"
  ): TypedContractMethod<[], [boolean], "view">;
  getFunction(
    nameOrSignature: "banUser"
  ): TypedContractMethod<[user: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "bookFactory"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "borrowBook"
  ): TypedContractMethod<[tokenId: BigNumberish], [void], "payable">;
  getFunction(
    nameOrSignature: "buyBook"
  ): TypedContractMethod<[tokenId: BigNumberish], [void], "payable">;
  getFunction(
    nameOrSignature: "canExecuteProposal"
  ): TypedContractMethod<[proposalId: BigNumberish], [boolean], "view">;
  getFunction(
    nameOrSignature: "createRentableBook"
  ): TypedContractMethod<
    [
      ipfsMetadata: string,
      depositAmount: BigNumberish,
      lendingPeriod: BigNumberish
    ],
    [bigint],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "createSellableBook"
  ): TypedContractMethod<
    [ipfsMetadata: string, price: BigNumberish],
    [bigint],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "getAllBookIds"
  ): TypedContractMethod<[], [bigint[]], "view">;
  getFunction(
    nameOrSignature: "getAllUsers"
  ): TypedContractMethod<[], [string[]], "view">;
  getFunction(
    nameOrSignature: "getBookDetails"
  ): TypedContractMethod<
    [tokenId: BigNumberish],
    [
      [string, bigint, string] & {
        contractAddress: string;
        bookType: bigint;
        bookData: string;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "getBookIdsPaginated"
  ): TypedContractMethod<
    [offset: BigNumberish, limit: BigNumberish],
    [bigint[]],
    "view"
  >;
  getFunction(
    nameOrSignature: "getBookRating"
  ): TypedContractMethod<
    [tokenId: BigNumberish],
    [[bigint, bigint] & { avgRating: bigint; count: bigint }],
    "view"
  >;
  getFunction(
    nameOrSignature: "getPendingProposals"
  ): TypedContractMethod<[], [bigint[]], "view">;
  getFunction(
    nameOrSignature: "getProposalInfo"
  ): TypedContractMethod<
    [proposalId: BigNumberish],
    [
      [bigint, bigint, string, string, bigint, bigint] & {
        id: bigint;
        proposalType: bigint;
        target: string;
        proposer: string;
        approvalCount: bigint;
        rejectionCount: bigint;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "getTotalBooks"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "getTotalUsers"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "getUserInfo"
  ): TypedContractMethod<
    [user: AddressLike],
    [
      [boolean, boolean, bigint, boolean] & {
        isRegistered: boolean;
        isBanned: boolean;
        trustLevel: bigint;
        isSystemOwner: boolean;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "governance"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "hasUserRatedBook"
  ): TypedContractMethod<
    [tokenId: BigNumberish, user: AddressLike],
    [boolean],
    "view"
  >;
  getFunction(
    nameOrSignature: "hasVoted"
  ): TypedContractMethod<[proposalId: BigNumberish], [boolean], "view">;
  getFunction(
    nameOrSignature: "initialize"
  ): TypedContractMethod<
    [
      userSystemAddress: AddressLike,
      governanceAddress: AddressLike,
      bookFactoryAddress: AddressLike,
      pausableControllerAddress: AddressLike
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "isOperationPaused"
  ): TypedContractMethod<[operationType: BigNumberish], [boolean], "view">;
  getFunction(
    nameOrSignature: "pausableController"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "pauseAll"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "pauseOperation"
  ): TypedContractMethod<[operationType: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "proposeAddOwner"
  ): TypedContractMethod<[newOwner: AddressLike], [bigint], "nonpayable">;
  getFunction(
    nameOrSignature: "proposeRemoveOwner"
  ): TypedContractMethod<[owner: AddressLike], [bigint], "nonpayable">;
  getFunction(
    nameOrSignature: "rateRentableBook"
  ): TypedContractMethod<
    [tokenId: BigNumberish, rating: BigNumberish],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "rateSellableBook"
  ): TypedContractMethod<
    [tokenId: BigNumberish, rating: BigNumberish],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "registerUser"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "rejectProposal"
  ): TypedContractMethod<[proposalId: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "returnBook"
  ): TypedContractMethod<[tokenId: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "setReturnerRewardPercentage"
  ): TypedContractMethod<[percentage: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "unbanUser"
  ): TypedContractMethod<[user: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "unpauseAll"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "unpauseOperation"
  ): TypedContractMethod<[operationType: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "userSystem"
  ): TypedContractMethod<[], [string], "view">;

  getEvent(
    key: "BookBorrowed"
  ): TypedContractEvent<
    BookBorrowedEvent.InputTuple,
    BookBorrowedEvent.OutputTuple,
    BookBorrowedEvent.OutputObject
  >;
  getEvent(
    key: "BookCreated"
  ): TypedContractEvent<
    BookCreatedEvent.InputTuple,
    BookCreatedEvent.OutputTuple,
    BookCreatedEvent.OutputObject
  >;
  getEvent(
    key: "BookPurchased"
  ): TypedContractEvent<
    BookPurchasedEvent.InputTuple,
    BookPurchasedEvent.OutputTuple,
    BookPurchasedEvent.OutputObject
  >;
  getEvent(
    key: "BookRated"
  ): TypedContractEvent<
    BookRatedEvent.InputTuple,
    BookRatedEvent.OutputTuple,
    BookRatedEvent.OutputObject
  >;
  getEvent(
    key: "BookReturned"
  ): TypedContractEvent<
    BookReturnedEvent.InputTuple,
    BookReturnedEvent.OutputTuple,
    BookReturnedEvent.OutputObject
  >;
  getEvent(
    key: "BookReturnedByThirdParty"
  ): TypedContractEvent<
    BookReturnedByThirdPartyEvent.InputTuple,
    BookReturnedByThirdPartyEvent.OutputTuple,
    BookReturnedByThirdPartyEvent.OutputObject
  >;
  getEvent(
    key: "ProposalRejected"
  ): TypedContractEvent<
    ProposalRejectedEvent.InputTuple,
    ProposalRejectedEvent.OutputTuple,
    ProposalRejectedEvent.OutputObject
  >;
  getEvent(
    key: "UserRegistered"
  ): TypedContractEvent<
    UserRegisteredEvent.InputTuple,
    UserRegisteredEvent.OutputTuple,
    UserRegisteredEvent.OutputObject
  >;

  filters: {
    "BookBorrowed(uint256,address)": TypedContractEvent<
      BookBorrowedEvent.InputTuple,
      BookBorrowedEvent.OutputTuple,
      BookBorrowedEvent.OutputObject
    >;
    BookBorrowed: TypedContractEvent<
      BookBorrowedEvent.InputTuple,
      BookBorrowedEvent.OutputTuple,
      BookBorrowedEvent.OutputObject
    >;

    "BookCreated(uint256,uint8)": TypedContractEvent<
      BookCreatedEvent.InputTuple,
      BookCreatedEvent.OutputTuple,
      BookCreatedEvent.OutputObject
    >;
    BookCreated: TypedContractEvent<
      BookCreatedEvent.InputTuple,
      BookCreatedEvent.OutputTuple,
      BookCreatedEvent.OutputObject
    >;

    "BookPurchased(uint256,address,address)": TypedContractEvent<
      BookPurchasedEvent.InputTuple,
      BookPurchasedEvent.OutputTuple,
      BookPurchasedEvent.OutputObject
    >;
    BookPurchased: TypedContractEvent<
      BookPurchasedEvent.InputTuple,
      BookPurchasedEvent.OutputTuple,
      BookPurchasedEvent.OutputObject
    >;

    "BookRated(uint256,address,uint256)": TypedContractEvent<
      BookRatedEvent.InputTuple,
      BookRatedEvent.OutputTuple,
      BookRatedEvent.OutputObject
    >;
    BookRated: TypedContractEvent<
      BookRatedEvent.InputTuple,
      BookRatedEvent.OutputTuple,
      BookRatedEvent.OutputObject
    >;

    "BookReturned(uint256,address)": TypedContractEvent<
      BookReturnedEvent.InputTuple,
      BookReturnedEvent.OutputTuple,
      BookReturnedEvent.OutputObject
    >;
    BookReturned: TypedContractEvent<
      BookReturnedEvent.InputTuple,
      BookReturnedEvent.OutputTuple,
      BookReturnedEvent.OutputObject
    >;

    "BookReturnedByThirdParty(uint256,address,address)": TypedContractEvent<
      BookReturnedByThirdPartyEvent.InputTuple,
      BookReturnedByThirdPartyEvent.OutputTuple,
      BookReturnedByThirdPartyEvent.OutputObject
    >;
    BookReturnedByThirdParty: TypedContractEvent<
      BookReturnedByThirdPartyEvent.InputTuple,
      BookReturnedByThirdPartyEvent.OutputTuple,
      BookReturnedByThirdPartyEvent.OutputObject
    >;

    "ProposalRejected(uint256,address)": TypedContractEvent<
      ProposalRejectedEvent.InputTuple,
      ProposalRejectedEvent.OutputTuple,
      ProposalRejectedEvent.OutputObject
    >;
    ProposalRejected: TypedContractEvent<
      ProposalRejectedEvent.InputTuple,
      ProposalRejectedEvent.OutputTuple,
      ProposalRejectedEvent.OutputObject
    >;

    "UserRegistered(address)": TypedContractEvent<
      UserRegisteredEvent.InputTuple,
      UserRegisteredEvent.OutputTuple,
      UserRegisteredEvent.OutputObject
    >;
    UserRegistered: TypedContractEvent<
      UserRegisteredEvent.InputTuple,
      UserRegisteredEvent.OutputTuple,
      UserRegisteredEvent.OutputObject
    >;
  };
}
